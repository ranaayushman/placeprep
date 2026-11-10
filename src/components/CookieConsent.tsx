"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type CookiePreferences = {
  necessary: true; // Always true
  preferences: boolean;
  analytics: boolean;
  advertising: boolean;
  timestamp: number;
};

const CONSENT_STORAGE_KEY = "placeprep_cookie_consent";
const CONSENT_COOKIE_NAME = "placeprep_cookie_consent";

/** Helper to programmatically open the cookie customization modal from anywhere in the app */
export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
  }
}

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const bannerRef = useRef<HTMLElement>(null);
  // Never over a running test: the banner covered "Save & Next". Tests set no optional cookies, so it can wait.
  const inTest = usePathname()?.startsWith("/attempt") ?? false;
  const bannerVisible = showBanner && !showModal && !inTest;

  // While the banner shows, pad the page by its height so buttons at the bottom can scroll above it.
  useEffect(() => {
    if (!bannerVisible || !bannerRef.current) return;
    const el = bannerRef.current;
    const pad = () => (document.body.style.paddingBottom = `${el.offsetHeight + 32}px`);
    pad();
    const ro = new ResizeObserver(pad);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.body.style.paddingBottom = "";
    };
  }, [bannerVisible]);

  // Load existing preferences on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed: CookiePreferences = JSON.parse(stored);
        setPreferences(!!parsed.preferences);
        setAnalytics(!!parsed.analytics);
        setAdvertising(!!parsed.advertising);
        setShowBanner(false);
      } else {
        // First visit: show banner after a small delay
        const timer = setTimeout(() => setShowBanner(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  // Listen for custom open event (e.g. from footer link or Cookie Policy page)
  useEffect(() => {
    const handleOpen = () => {
      // Re-read latest saved preferences
      try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (stored) {
          const parsed: CookiePreferences = JSON.parse(stored);
          setPreferences(!!parsed.preferences);
          setAnalytics(!!parsed.analytics);
          setAdvertising(!!parsed.advertising);
        }
      } catch {}
      setShowModal(true);
      setShowBanner(false);
    };

    window.addEventListener("open-cookie-preferences", handleOpen);
    return () => window.removeEventListener("open-cookie-preferences", handleOpen);
  }, []);

  const saveConsent = (prefs: { preferences: boolean; analytics: boolean; advertising: boolean }) => {
    const consentObj: CookiePreferences = {
      necessary: true,
      preferences: prefs.preferences,
      analytics: prefs.analytics,
      advertising: prefs.advertising,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentObj));
      // Set 1-year persistent cookie so server can read it if needed
      document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
        JSON.stringify(consentObj)
      )}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    } catch (e) {
      console.warn("Unable to persist cookie consent:", e);
    }

    setPreferences(prefs.preferences);
    setAnalytics(prefs.analytics);
    setAdvertising(prefs.advertising);
    setShowBanner(false);
    setShowModal(false);

    // Notify any listeners
    window.dispatchEvent(new CustomEvent("placeprep-cookies-updated", { detail: consentObj }));
  };

  const acceptAll = () => {
    saveConsent({ preferences: true, analytics: true, advertising: true });
  };

  const rejectOptional = () => {
    saveConsent({ preferences: false, analytics: false, advertising: false });
  };

  const saveCustom = () => {
    saveConsent({ preferences, analytics, advertising });
  };

  if (!mounted) return null;

  return (
    <>
      {/* ── Floating Cookie Banner (bottom) ─────────────────────────── */}
      {bannerVisible && (
        <aside
          ref={bannerRef}
          role="region"
          aria-label="Cookie preferences"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-2xl border border-deep/15 bg-white p-5 shadow-2xl shadow-deep/20 sm:p-6"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>
                  🍪
                </span>
                <h3 className="font-semibold text-deep">We respect your privacy</h3>
              </div>
              <p className="leading-relaxed">
                PlacePrep is 100% free. We use strictly necessary cookies to keep you signed in and ensure security.
                You can also choose whether to enable functional preferences and performance cookies. Read our{" "}
                <Link href="/cookies" className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark">
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Customise
              </button>
              <button
                type="button"
                onClick={rejectOptional}
                className="rounded-xl border border-deep/20 bg-canvas-deep px-3.5 py-2 text-xs font-semibold text-deep transition hover:bg-slate-200"
              >
                Necessary only
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-deep"
              >
                Accept all
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── Customise Modal ────────────────────────────────────────── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>
                  🍪
                </span>
                <h2 id="cookie-modal-title" className="text-lg font-bold text-deep">
                  Cookie Preferences
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6 text-sm">
              <p className="text-slate-600 leading-relaxed">
                Choose which categories of cookies you want to allow. You can change these preferences at any time by
                visiting our{" "}
                <Link href="/cookies" onClick={() => setShowModal(false)} className="text-brand underline">
                  Cookie Policy
                </Link>{" "}
                or clicking &ldquo;Cookie Settings&rdquo; in the footer.
              </p>

              {/* Category 1: Strictly Necessary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">Strictly Necessary Cookies</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Essential for login authentication (<code className="font-mono text-slate-700">sid</code>), security
                      CSRF protection, and saving your cookie choices. These cannot be disabled.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    Always Active
                  </span>
                </div>
              </div>

              {/* Category 2: Functional / Preferences */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">Preferences &amp; Functionality</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Remembers your test UI configurations, custom practice preferences, and interface states between visits.
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={preferences}
                      onChange={(e) => setPreferences(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-brand-dark peer-focus:outline-none after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {/* Category 3: Analytics / Performance */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">Analytics &amp; Performance</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Helps us measure site health, aggregate question answering speeds, and detect technical glitches so we can keep PlacePrep fast and reliable.
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-brand-dark peer-focus:outline-none after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {/* Category 4: Advertising */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">Advertising</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Allows limited advertising in non-exam areas if advertising is introduced. Ads are currently inactive and never access camera or assessment data.
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={advertising}
                      onChange={(e) => setAdvertising(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-brand-dark peer-focus:outline-none after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:shadow-sm after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={rejectOptional}
                className="text-xs font-semibold text-slate-600 underline hover:text-deep"
              >
                Reject Non-Essential
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveCustom}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Save My Preferences
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-deep"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Standalone button that opens the cookie customization modal */
export function CookieSettingsButton({
  className = "text-muted hover:text-deep underline underline-offset-4",
  children = "Cookie Settings",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={openCookiePreferences} className={className}>
      {children}
    </button>
  );
}
