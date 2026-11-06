"use client";

import { useEffect, useState } from "react";

type Check = { label: string; ok: boolean | null; hint: string };

/** Pre-exam checks, like the "system compatibility" step on assessment platforms. */
export function SystemCheck() {
  const [checks, setChecks] = useState<Check[]>([]);

  useEffect(() => {
    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|Mobile/i.test(ua);
    setChecks([
      { label: "Desktop or laptop", ok: !mobile, hint: "Real assessments usually block phones and tablets." },
      { label: "Full-screen support", ok: !!document.documentElement.requestFullscreen, hint: "Needed for proctored mode." },
      { label: "Screen width ≥ 1024px", ok: window.innerWidth >= 1024, hint: "The question palette is hidden on small screens." },
      { label: "Online", ok: navigator.onLine, hint: "Answers are saved to the server as you go." },
    ]);
  }, []);

  if (!checks.length) return null;
  return (
    <div className="card">
      <h2 className="font-semibold">System check</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            <span className={c.ok ? "text-emerald-600" : "text-amber-600"}>{c.ok ? "✓" : "!"}</span>
            <span>
              <span className="font-medium">{c.label}</span>
              {!c.ok && <span className="block text-slate-500">{c.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
