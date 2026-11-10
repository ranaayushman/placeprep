"use client";

import { useEffect } from "react";

const sent = new Set<string>();

/** Sends one browser error to /api/errors (Admin → Errors). At most 5 per page load, each message once. */
export function reportClientError(e: { message?: string; stack?: string; digest?: string }) {
  const message = e.message || "Unknown error";
  if (sent.has(message) || sent.size >= 5) return;
  sent.add(message);
  const body = JSON.stringify({ message, stack: e.stack, digest: e.digest, path: location.pathname });
  fetch("/api/errors", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}

/** Catches errors no error screen sees: failures in click handlers, timers and promises. */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (ev: ErrorEvent) => {
      // Browser extensions and cross-origin scripts report a bare "Script error." with nothing to act on.
      if (!ev.message || ev.message === "Script error.") return;
      reportClientError({ message: ev.message, stack: ev.error?.stack });
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      const r = ev.reason as { message?: string; stack?: string } | undefined;
      reportClientError({ message: r?.message ?? String(ev.reason), stack: r?.stack });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
