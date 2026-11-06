"use client";

import type { ViolationType } from "@/lib/exam/service";
import { useFaceProctor } from "./useFaceProctor";

const STATE_LABEL: Record<string, string> = {
  idle:       "Camera off",
  requesting: "Requesting camera…",
  denied:     "Camera denied",
  loading:    "Loading model…",
  running:    "Live",
  error:      "Camera error",
};

const SEEN_LABEL = { ok: "Face OK", away: "Look at the screen", "no-face": "No face", multiple: "Multiple faces" } as const;

/**
 * FaceProctoringTile — shows the student's webcam feed with the
 * MediaPipe iris-tracking overlay, and fires violations via onViolation().
 *
 * Replaces the old <CameraPreview /> in mock mode.
 */
export function FaceProctoringTile({
  enabled,
  onViolation,
}: {
  enabled: boolean;
  onViolation: (t: ViolationType) => void;
}) {
  const { videoRef, canvasRef, state, errorMessage, seen } = useFaceProctor({ enabled, onViolation });

  const isLive = state === "running";
  const isDenied = state === "denied";
  const hasError = state === "error";

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-300 bg-slate-900"
         style={{ width: 112, height: 84 }}>

      {/* Video feed (mirrored like a selfie cam) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />

      {/* Iris overlay canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />

      {/* Status badge */}
      <span
        className={`absolute left-1 top-1 flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold
          ${isLive ? "bg-black/50 text-green-400" : isDenied || hasError ? "bg-black/60 text-red-400" : "bg-black/50 text-yellow-300"}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse bg-green-400" : isDenied || hasError ? "bg-red-400" : "bg-yellow-300"}`} />
        {STATE_LABEL[state] ?? state}
      </span>

      {isLive && seen && (
        <span
          role="status"
          className={`absolute inset-x-0 bottom-0 py-0.5 text-center text-[9px] font-semibold ${seen === "ok" ? "bg-black/50 text-green-400" : "bg-red-600/90 text-white"}`}
        >
          {SEEN_LABEL[seen]}
        </span>
      )}

      {/* Overlay message when not live */}
      {!isLive && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 p-2 text-center">
          <p className="text-[10px] leading-tight text-white/80">
            {state === "idle"       && "Starting camera…"}
            {state === "requesting" && "Allow camera access"}
            {state === "loading"    && "Loading face model…"}
            {isDenied               && "Camera unavailable — face checks disabled"}
            {hasError               && (errorMessage ?? "Face checks could not start")}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Kept for backward-compat with practice mode (non-mock).
 * Shows a simple opt-in camera preview with no analysis.
 */
export function CameraPreview() {
  const { videoRef, state } = useFaceProctor({ enabled: true, onViolation: () => {} });
  const isLive = state === "running";
  return (
    <div className="relative overflow-hidden rounded-md border border-slate-300 bg-slate-900"
         style={{ width: 64, height: 48 }}>
      <video ref={videoRef} autoPlay muted playsInline
             className="h-full w-full -scale-x-100 object-cover" />
      <span className="absolute left-1 top-1 h-2 w-2 rounded-full"
            style={{ background: isLive ? "#4ade80" : "#94a3b8" }} />
    </div>
  );
}
