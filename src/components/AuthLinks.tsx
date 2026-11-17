"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Header links on public pages: "Dashboard" when signed in, otherwise Log in / Sign up.
 * Client-side so those pages stay static and are served from the CDN.
 */
export function AuthLinks() {
  // shortcut: reads the non-secret signed_in flag, not the session; an expired session shows
  // "Dashboard", which then sends the student to /login.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(/(?:^|; )signed_in=1/.test(document.cookie)), []);
  const button = "rounded-lg bg-brand-dark px-4 py-2 font-semibold text-white hover:bg-deep";
  if (signedIn)
    return (
      <Link href="/dashboard" className={button}>
        Dashboard
      </Link>
    );
  return (
    <>
      <Link href="/login" className="px-3 py-2 text-muted hover:text-deep">
        Log in
      </Link>
      <Link href="/register" className={button}>
        Sign up free
      </Link>
    </>
  );
}
