"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/(auth)/actions";
import { openCookiePreferences } from "./CookieConsent";

const ITEM = "block w-full px-4 py-2.5 text-left text-sm text-deep hover:bg-brand-soft";

/** `admin`: the admin header version (dark button, a "Student view" link, no deletion request). */
export function ProfileMenu({ name, email, admin = false }: { name: string; email: string; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium ${admin ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-muted hover:bg-brand-soft hover:text-deep"}`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-dark text-xs font-semibold text-white" aria-hidden>
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="hidden max-w-32 truncate md:inline">{name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-deep/10 bg-white shadow-lg">
          <div className="border-b border-deep/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-deep">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          {admin && (
            <Link href="/dashboard" className={ITEM} onClick={() => setOpen(false)}>
              Student view
            </Link>
          )}
          <Link href="/account" className={ITEM} onClick={() => setOpen(false)}>
            Account &amp; password
          </Link>
          <button
            type="button"
            className={ITEM}
            onClick={() => {
              setOpen(false);
              openCookiePreferences();
            }}
          >
            Cookie settings
          </button>
          {/* Deletion is done by an admin on request, as the Privacy Policy says. */}
          {!admin && (
            <a href="mailto:support@placeprep.me?subject=Delete%20my%20PlacePrep%20account" className={ITEM}>
              Request account deletion
            </a>
          )}
          <form action={logout} className="border-t border-deep/10">
            <button className={`${ITEM} font-medium text-danger`}>Log out</button>
          </form>
        </div>
      )}
    </div>
  );
}
