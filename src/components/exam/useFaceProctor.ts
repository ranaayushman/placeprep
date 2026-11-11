"use client";

/**
 * useFaceProctor — MediaPipe FaceMesh-based camera proctoring hook.
 *
 * What it detects (all client-side, nothing is recorded or uploaded):
 *   • No face in frame for > NO_FACE_GRACE_MS
 *   • More than one face in frame for > MULTI_FACE_GRACE_MS
 *   • Gaze or head turned away from the student's calibrated baseline for > GAZE_GRACE_MS
 * Each fires once per episode, not repeatedly while it lasts.
 *
 * It plugs into the same onViolation() callback used by useProctoring.ts, so the
 * existing warning counter, auto-submit, and admin event log all work automatically.
 *
 * Usage:
 *   const face = useFaceProctor({ enabled: isMock, onViolation });
 *   <video ref={face.videoRef} ... />
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ViolationType } from "@/lib/exam/service";

// ─── Tuning knobs ────────────────────────────────────────────────────────────

/** How long gaze must stay off-screen before it counts (reading across a wide line can briefly look "away"). */
const GAZE_GRACE_MS = 4000;
/** Longer for no-face: looking down at rough paper often hides the face from the camera. */
const NO_FACE_GRACE_MS = 5000;
/** A second face must stay this long: one-frame ghost detections (posters, reflections) are ignored. */
const MULTI_FACE_GRACE_MS = 1500;
/** After an alert, things must look normal this long before the same alert can fire again: one alert per episode. */
const REARM_MS = 2000;

/**
 * Iris deviation threshold (fraction of eye width), measured from the student's own calibrated
 * "looking at the screen" position. 0.2 ≈ a clear sideways glance. Increase to be more lenient.
 */
const GAZE_THRESHOLD = 0.2;
/** The first checks with one face set the baseline, so an off-centre camera doesn't read as "away". */
const CALIBRATION_CHECKS = 6;
/** A baseline further off than this is a bad calibration (they were looking away), so it is capped. */
const MAX_BASELINE = 0.15;
/** Smoothing for the per-check gaze and head readings (0–1; lower = steadier, slower). */
const SMOOTHING = 0.4;

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

/**
 * One tracker per alert type: fires once when a bad state lasts `grace` ms, and re-arms only after
 * REARM_MS of normal, so a long look away is one alert, not one every few seconds.
 */
export function createAlertTracker(fire: (type: ViolationType) => void) {
  let tracks: Record<string, { since: number | null; okSince: number | null; fired: boolean }> = {};
  return {
    step(type: ViolationType, bad: boolean, grace: number, now: number) {
      const t = (tracks[type] ??= { since: null, okSince: null, fired: false });
      if (bad) {
        t.okSince = null;
        t.since ??= now;
        if (!t.fired && now - t.since >= grace) {
          t.fired = true;
          fire(type);
        }
      } else {
        t.since = null;
        if (t.fired && now - (t.okSince ??= now) >= REARM_MS) {
          t.fired = false;
          t.okSince = null;
        }
      }
    },
    reset() {
      tracks = {};
    },
  };
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
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);

  const [state, setState] = useState<FaceProcState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** What the camera sees right now, so the student gets live feedback. */
  const [seen, setSeen] = useState<"ok" | "away" | "no-face" | "multiple" | null>(null);

  // Mutable refs so the rAF loop never captures a stale closure.
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const tracker = useRef(createAlertTracker((type) => onViolationRef.current(type)));
  const step = useCallback((type: ViolationType, bad: boolean, grace: number, now: number) => tracker.current.step(type, bad, grace, now), []);

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
        rafRef.current = requestAnimationFrame(sendFrame);
      };
      rafRef.current = requestAnimationFrame(sendFrame);

      // ── 4. Evaluate results at CHECK_INTERVAL_MS ───────────────────────────
      const calib = { gaze: [] as number[], yaw: [] as number[], baseGaze: 0, baseYaw: 0 };
      const smooth = { gaze: 0, yaw: 0, primed: false };
      const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
      const cap = (x: number) => Math.max(-MAX_BASELINE, Math.min(MAX_BASELINE, x));
      checkTimer = setInterval(() => {
        // A hidden tab sends no frames, so the last result is stale (and leaving the tab is its own warning).
        if (cancelled || !lastResults || document.hidden) return;
        const faces: Landmark[][] = lastResults.multiFaceLandmarks ?? [];
        const now = Date.now();

        step("no-face", faces.length === 0, NO_FACE_GRACE_MS, now);
        step("multiple-faces", faces.length >= 2, MULTI_FACE_GRACE_MS, now);
        if (faces.length === 0) {
          setSeen("no-face");
          smooth.primed = false;
          return;
        }

        // Gaze check on the first (primary) face. Signed values, so the baseline can be subtracted.
        const lm = faces[0];
        if (lm.length <= R_IRIS) return;
        const gaze = (gazeRatio(lm[L_IRIS], lm[L_INNER], lm[L_OUTER]) + gazeRatio(lm[R_IRIS], lm[R_INNER], lm[R_OUTER])) / 2;
        // Turning the head keeps the iris centred in the eye, so check head yaw too.
        const faceW = Math.abs(lm[FACE_R].x - lm[FACE_L].x);
        const yaw = faceW > 0.001 ? (lm[NOSE].x - (lm[FACE_L].x + lm[FACE_R].x) / 2) / faceW : 0;

        if (calib.gaze.length < CALIBRATION_CHECKS) {
          if (faces.length === 1) {
            calib.gaze.push(gaze);
            calib.yaw.push(yaw);
            if (calib.gaze.length === CALIBRATION_CHECKS) {
              calib.baseGaze = cap(median(calib.gaze));
              calib.baseYaw = cap(median(calib.yaw));
            }
          }
          setSeen(faces.length >= 2 ? "multiple" : "ok");
          return;
        }

        if (!smooth.primed) Object.assign(smooth, { gaze, yaw, primed: true });
        smooth.gaze += SMOOTHING * (gaze - smooth.gaze);
        smooth.yaw += SMOOTHING * (yaw - smooth.yaw);
        const away = Math.abs(smooth.gaze - calib.baseGaze) > GAZE_THRESHOLD || Math.abs(smooth.yaw - calib.baseYaw) > YAW_THRESHOLD;
        setSeen(faces.length >= 2 ? "multiple" : away ? "away" : "ok");
        step("gaze-away", away, GAZE_GRACE_MS, now);
      }, CHECK_INTERVAL_MS);
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
      tracker.current.reset();
    };
  }, [enabled, step]);

  return { videoRef, state, errorMessage, seen };
}
