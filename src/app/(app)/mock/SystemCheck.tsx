"use client";

import { useEffect, useState } from "react";

type Check = { label: string; ok: boolean | null; hint: string };

/** Pre-exam checks, like the "system compatibility" step on assessment platforms. */
export function SystemCheck({ onReady }: { onReady: (ready: boolean) => void }) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  useEffect(() => {
    setFullscreenSupported(!!document.documentElement.requestFullscreen);
    const updateFullscreen = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", updateFullscreen);
    updateFullscreen();
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|Mobile/i.test(ua);
    const baseChecks: Check[] = [
      { label: "Desktop or laptop", ok: !mobile, hint: "Real assessments usually block phones and tablets." },
      { label: "Screen width ≥ 1024px", ok: window.innerWidth >= 1024, hint: "The question palette is hidden on small screens." },
      { label: "Online", ok: navigator.onLine, hint: "Answers are saved to the server as you go." },
      { label: "Camera", ok: null, hint: "Allow camera access so local face checks can run." },
    ];
    setChecks(baseChecks);

    const updateOnline = () => setChecks((current) => current.map((check) => check.label === "Online" ? { ...check, ok: navigator.onLine } : check));
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    let active = true;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false }).then((stream) => {
      stream.getTracks().forEach((track) => track.stop());
      if (active) setChecks((current) => current.map((check) => check.label === "Camera" ? { ...check, ok: true } : check));
    }).catch(() => {
      if (active) setChecks((current) => current.map((check) => check.label === "Camera" ? { ...check, ok: false } : check));
    });

    return () => {
      active = false;
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const ready = checks.every((check) => check.ok === true) && fullscreenSupported && fullscreen;
  useEffect(() => {
    onReady(ready);
  }, [onReady, ready]);
  if (!checks.length) return null;

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">System check</h2>
          <p className="mt-1 text-sm text-slate-500">Complete these checks before starting the mock.</p>
        </div>
        <button
          type="button"
          onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
          disabled={!fullscreenSupported || fullscreen}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {fullscreen ? "Full screen enabled" : "Enable full screen"}
        </button>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            <span className={c.ok === true ? "text-emerald-600" : c.ok === false ? "text-red-600" : "text-amber-600"}>{c.ok === true ? "✓" : c.ok === false ? "✕" : "…"}</span>
            <span>
              <span className="font-medium">{c.label}</span>
              {c.ok !== true && <span className="block text-slate-500">{c.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
      {!fullscreenSupported && <p className="mt-3 text-sm text-red-700">This browser does not support full screen mode.</p>}
      {fullscreenSupported && !fullscreen && <p className="mt-3 text-sm text-amber-700">Enable full screen to unlock the start button.</p>}
    </div>
  );
}
