"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ViolationType } from "@/lib/exam/service";

/**
 * Browser-side proctoring, modelled on what online assessment platforms do:
 * full-screen enforcement, tab/window switch detection, and blocking copy/paste/devtools keys.
 *
 * Honest limits: a browser cannot see other devices or a second monitor, and a determined user
 * can bypass any client-side check. The goal is to recreate the *pressure and rules* of the
 * real exam so you practise under the same conditions — not to be tamper-proof.
 */
export function useProctoring({ enabled, onViolation }: { enabled: boolean; onViolation: (t: ViolationType) => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [everEntered, setEverEntered] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const lastViolation = useRef(0);
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;
  const supported = typeof document !== "undefined" && !!document.documentElement.requestFullscreen;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  /** One user action (e.g. Alt+Tab) fires blur + visibilitychange + fullscreenchange; count it once. */
  const report = useCallback((type: ViolationType) => {
    const t = Date.now();
    if (t - lastViolation.current < 2000) return;
    lastViolation.current = t;
    onViolationRef.current(type);
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Unsupported (e.g. some iOS browsers): fall back to tab-switch detection only.
      setEverEntered(true);
      setIsFullscreen(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onFs = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) setEverEntered(true);
      else report("fullscreen-exit");
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") report("tab-hidden");
    };
    const onBlur = () => report("window-blur");
    const block = (e: Event) => {
      e.preventDefault();
      flash("Copy, paste and right-click are disabled during the test");
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const devtools = k === "f12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) || ((e.ctrlKey || e.metaKey) && k === "u");
      if (devtools) {
        e.preventDefault();
        report("devtools-key");
        flash("Developer tools are not allowed during the test");
      }
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "p", "s"].includes(k) && !e.shiftKey) {
        e.preventDefault();
        flash("This shortcut is disabled during the test");
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [enabled, report]);

  return { blocked: enabled && !isFullscreen, everEntered, enterFullscreen, supported, toast };
}
