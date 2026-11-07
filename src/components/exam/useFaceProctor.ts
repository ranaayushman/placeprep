"use client";

/**
 * useFaceProctor — MediaPipe FaceMesh-based camera proctoring hook.
 *
 * What it detects (all client-side, nothing is recorded or uploaded):
 *   • No face in frame for > GAZE_GRACE_MS
 *   • More than one face in frame
 *   • Gaze consistently off-screen (iris deviation > GAZE_THRESHOLD) for > GAZE_GRACE_MS
 *
 * It plugs into the same onViolation() callback used by useProctoring.ts, so the
 * existing warning counter, auto-submit, and admin event log all work automatically.
 *
 * Usage:
 *   const face = useFaceProctor({ enabled: isMock, onViolation });
 *   <video ref={face.videoRef} ... />
 *   <canvas ref={face.canvasRef} ... />  ← optional overlay
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ViolationType } from "@/lib/exam/service";

// ─── Tuning knobs ────────────────────────────────────────────────────────────

/** How long gaze must be off-screen before it counts. */
const GAZE_GRACE_MS = 2000;
/** Longer for no-face: looking down at rough paper often hides the face from the camera. */
const NO_FACE_GRACE_MS = 5000;

/**
 * Iris deviation threshold (0–1 scale of eye width).
 * Straight ahead measures ~0.05–0.1; 0.2 ≈ a clear sideways glance. Increase to be more lenient.
 */
const GAZE_THRESHOLD = 0.2;

/** How often (ms) we re-evaluate the last landmark result. */
const CHECK_INTERVAL_MS = 500;

// ─── MediaPipe landmark indices ──────────────────────────────────────────────
// Left eye corners  : 33 (outer), 133 (inner)
// Right eye corners : 362 (inner), 263 (outer)
// Left iris centre  : 468
// Right iris centre : 473

const L_OUTER = 33;
const L_INNER = 133;
const R_INNER = 362;
const R_OUTER = 263;
const L_IRIS  = 468;
const R_IRIS  = 473;

// Head turn: nose tip vs. the face's left/right edges.
const NOSE = 1;
const FACE_L = 234;
const FACE_R = 454;
/** Nose offset from face centre as a fraction of face width; 0.18 ≈ head turned ~30°. */
const YAW_THRESHOLD = 0.18;

const MEDIAPIPE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619";

let scriptPromise: Promise<void> | null = null;
function loadScript(src: string) {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.crossOrigin = "anonymous";
    el.onload = () => resolve();
    el.onerror = () => { scriptPromise = null; reject(new Error("could not load the face model")); };
    document.head.appendChild(el);
  });
  return scriptPromise;
}

type Landmark = { x: number; y: number; z: number };

function gazeRatio(iris: Landmark, inner: Landmark, outer: Landmark): number {
  // Horizontal position of iris within [outer, inner] range, normalised to [-1, 1].
  // 0 = centre, negative = left, positive = right.
  const eyeWidth = Math.abs(outer.x - inner.x);
  if (eyeWidth < 0.001) return 0;
  const centre = (outer.x + inner.x) / 2;
  return (iris.x - centre) / eyeWidth;
}

export type FaceProcState =
  | "idle"          // camera not started
  | "requesting"    // waiting for getUserMedia
  | "denied"        // user rejected / no camera
  | "loading"       // model loading
  | "running"       // all good, analysing
  | "error";        // unexpected failure

export function useFaceProctor({
  enabled,
  onViolation,
}: {
  enabled: boolean;
  onViolation: (t: ViolationType) => void;
}) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);

  const [state, setState] = useState<FaceProcState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** What the camera sees right now, so the student gets live feedback. */
  const [seen, setSeen] = useState<"ok" | "away" | "no-face" | "multiple" | null>(null);

  // Mutable refs so the rAF loop never captures a stale closure.
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const noFaceSince   = useRef<number | null>(null);
  const gazeAwaySince = useRef<number | null>(null);
  const lastReport    = useRef<Record<string, number>>({});

  const report = useCallback((type: ViolationType) => {
    const now = Date.now();
    if ((now - (lastReport.current[type] ?? 0)) < 8000) return; // debounce 8 s per type
    lastReport.current[type] = now;
    onViolationRef.current(type);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let faceMesh: any = null;
    let lastResults: any = null;
    let checkTimer: ReturnType<typeof setInterval> | null = null;

    async function start() {
      // ── 1. Camera ──────────────────────────────────────────────────────────
      setErrorMessage(null);
      setState("requesting");
      let stream: MediaStream | null = null;
      let cameraError: unknown;
      for (let attempt = 0; attempt < 2 && !cancelled; attempt += 1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            audio: false,
          });
          break;
        } catch (error: unknown) {
          cameraError = error;
          if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      if (!stream) {
        if (!cancelled) {
          const name = cameraError instanceof DOMException ? cameraError.name : "UnknownError";
          const message =
            name === "NotReadableError"
              ? "Camera is busy. Close other camera apps and try again."
              : name === "NotAllowedError"
                ? "Camera permission is blocked for this site."
                : name === "NotFoundError"
                  ? "No camera was found on this device."
                  : `Camera could not start (${name}).`;
          setErrorMessage(message);
          setState("denied");
        }
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // ── 2. Load MediaPipe FaceMesh ─────────────────────────────────────────
      setState("loading");
      // Script and its wasm/model files must come from the same version, or initialize() fails.
      // The package has no exports (it sets window.FaceMesh), so load it as a plain script.
      await loadScript(`${MEDIAPIPE_CDN}/face_mesh.js`);
      if (cancelled) return;

      faceMesh = new (window as any).FaceMesh({
        locateFile: (file: string) => `${MEDIAPIPE_CDN}/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 2,          // detect up to 2 so we can flag multiple faces
        refineLandmarks: true,   // gives us iris landmarks (468–477)
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results: any) => { lastResults = results; });
      await faceMesh.initialize();
      if (cancelled) return;
      setState("running");

      // ── 3. Send frames to FaceMesh ─────────────────────────────────────────
      const sendFrame = async () => {
        if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(sendFrame);
          return;
        }
        await faceMesh.send({ image: videoRef.current }).catch(() => {});
        drawOverlay(lastResults);
        rafRef.current = requestAnimationFrame(sendFrame);
      };
      rafRef.current = requestAnimationFrame(sendFrame);

      // ── 4. Evaluate results at CHECK_INTERVAL_MS ───────────────────────────
      checkTimer = setInterval(() => {
        if (cancelled || !lastResults) return;
        const faces: Landmark[][] = lastResults.multiFaceLandmarks ?? [];
        const now = Date.now();

        if (faces.length === 0) {
          // No face in frame
          setSeen("no-face");
          if (noFaceSince.current === null) noFaceSince.current = now;
          else if (now - noFaceSince.current > NO_FACE_GRACE_MS) report("no-face");
          gazeAwaySince.current = null;
          return;
        }
        noFaceSince.current = null;

        if (faces.length >= 2) {
          setSeen("multiple");
          report("multiple-faces");
        }

        // Gaze check on the first (primary) face
        const lm = faces[0];
        if (lm.length > R_IRIS) {
          const lRatio = gazeRatio(lm[L_IRIS], lm[L_INNER], lm[L_OUTER]);
          const rRatio = gazeRatio(lm[R_IRIS], lm[R_INNER], lm[R_OUTER]);
          const avgRatio = (Math.abs(lRatio) + Math.abs(rRatio)) / 2;
          // Turning the head keeps the iris centred in the eye, so check head yaw too.
          const faceW = Math.abs(lm[FACE_R].x - lm[FACE_L].x);
          const yaw = faceW > 0.001 ? Math.abs(lm[NOSE].x - (lm[FACE_L].x + lm[FACE_R].x) / 2) / faceW : 0;

          const away = avgRatio > GAZE_THRESHOLD || yaw > YAW_THRESHOLD;
          if (faces.length === 1) setSeen(away ? "away" : "ok");
          if (away) {
            if (gazeAwaySince.current === null) gazeAwaySince.current = now;
            else if (now - gazeAwaySince.current > GAZE_GRACE_MS) report("gaze-away");
          } else {
            gazeAwaySince.current = null;
          }
        }
      }, CHECK_INTERVAL_MS);
    }

    // ── Overlay drawing ──────────────────────────────────────────────────────
    function drawOverlay(results: any) {
      const canvas = canvasRef.current;
      const video  = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width  = video.videoWidth  || 320;
      canvas.height = video.videoHeight || 240;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const faces: Landmark[][] = results?.multiFaceLandmarks ?? [];
      if (faces.length === 0) return;

      // Draw iris dots only (subtle; not scary)
      const { width: W, height: H } = canvas;
      ctx.fillStyle = "rgba(99,230,190,0.9)";
      for (const lm of faces) {
        for (const idx of [L_IRIS, R_IRIS]) {
          if (lm[idx]) {
            ctx.beginPath();
            // Sized to the frame: the tile shows it at ~1/6 scale.
            ctx.arc(lm[idx].x * W, lm[idx].y * H, W / 60, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    start().catch((error: unknown) => {
      if (!cancelled) {
        setErrorMessage(error instanceof Error ? `Face checks could not start: ${error.message}` : "Face checks could not start.");
        setState("error");
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (checkTimer) clearInterval(checkTimer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      faceMesh?.close?.();
      setState("idle");
      setSeen(null);
    };
  }, [enabled, report]);

  return { videoRef, canvasRef, state, errorMessage, seen };
}
