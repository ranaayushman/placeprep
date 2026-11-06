"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Optional webcam tile, like the self-view in proctored exams. The video never leaves the browser:
 * nothing is recorded or uploaded. It exists only so practice feels like the real thing.
 */
export function CameraPreview() {
  const [on, setOn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!on) return;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 160, height: 120 }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream.current = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => {
        setErr("Camera unavailable");
        setOn(false);
      });
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
    };
  }, [on]);

  if (!on)
    return (
      <button onClick={() => { setErr(null); setOn(true); }} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50" title={err ?? "Show a local camera preview (nothing is recorded)"}>
        {err ?? "Camera"}
      </button>
    );
  return (
    <button onClick={() => setOn(false)} title="Camera preview — local only. Click to turn off." className="relative overflow-hidden rounded-md border border-slate-300">
      <video ref={video} autoPlay muted playsInline className="h-12 w-16 -scale-x-100 object-cover" />
      <span className="absolute left-1 top-1 h-2 w-2 animate-pulse rounded-full bg-red-500" />
    </button>
  );
}
