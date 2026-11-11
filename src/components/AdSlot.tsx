"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

export const ADSENSE_CLIENT = "ca-pub-1010726208873742";
const CONSENT_KEY = "placeprep_cookie_consent";

const advertisingAllowed = () => {
  try {
    return !!JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null")?.advertising;
  } catch {
    return false;
  }
};

/**
 * One Google AdSense unit. Loads Google's script only after the student allows advertising cookies
 * (the Privacy Policy promises consent first), and never on test pages. Renders nothing without a
 * slot id (create a display ad unit in AdSense and set NEXT_PUBLIC_ADSENSE_SLOT_*).
 */
export function AdSlot({ slot, className = "" }: { slot?: string; className?: string }) {
  const [allowed, setAllowed] = useState(false);
  const pushed = useRef(false);
  const inTest = usePathname()?.startsWith("/attempt") ?? false;

  useEffect(() => {
    setAllowed(advertisingAllowed());
    const onChange = () => setAllowed(advertisingAllowed());
    window.addEventListener("placeprep-cookies-updated", onChange);
    return () => window.removeEventListener("placeprep-cookies-updated", onChange);
  }, []);

  const show = !!slot && allowed && !inTest;
  useEffect(() => {
    if (!show || pushed.current) return;
    pushed.current = true;
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
    } catch {
      /* ad blockers make this throw; the box just stays empty */
    }
  }, [show]);

  if (!show) return null;
  return (
    <div className={className}>
      <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted uppercase">Advertisement</p>
      <Script id="adsbygoogle-js" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" strategy="afterInteractive" />
      <ins className="adsbygoogle block" style={{ display: "block" }} data-ad-client={ADSENSE_CLIENT} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
