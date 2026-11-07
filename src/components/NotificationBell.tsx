"use client";

import { useEffect, useRef, useState } from "react";
import type { Announcement } from "@/lib/announcements";

// shortcut: "seen" lives in this browser only, so another device shows the dot again; move to a users column if that annoys people.
const SEEN_KEY = "pp-updates-seen";

export function NotificationBell({ items }: { items: Announcement[] }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<number | null>(null);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const latest = items[0]?.createdAt ?? 0;

  useEffect(() => setSeen(Number(localStorage.getItem(SEEN_KEY) ?? 0)), []);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  useEffect(() => {
    if (!open) return;
    localStorage.setItem(SEEN_KEY, String(latest));
    setSeen(latest);
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open, latest]);

  const unread = seen !== null && latest > seen;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? "Updates (new)" : "Updates"}
        aria-expanded={open}
        className="relative rounded-md p-1.5 text-muted hover:bg-brand-soft hover:text-deep"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-deep/10 bg-white shadow-lg">
          <p className="border-b border-deep/10 px-4 py-2.5 text-sm font-semibold">Updates</p>
          <ul className="max-h-96 divide-y divide-deep/5 overflow-y-auto">
            {items.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSelected(a);
                  }}
                  className="flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left hover:bg-brand-soft"
                >
                  <span className="truncate text-sm font-medium text-deep">{a.title}</span>
                  <span className="shrink-0 text-xs text-muted/70">{fmtDay(a.createdAt)}</span>
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No updates yet.</li>}
          </ul>
        </div>
      )}
      {/* Native <dialog>: Escape, focus trap and backdrop come from the browser. Clicking the backdrop closes it. */}
      <dialog
        ref={dialog}
        onClose={() => setSelected(null)}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        aria-labelledby="update-title"
        className="m-auto w-[32rem] max-w-[calc(100vw-2rem)] rounded-xl p-0 shadow-xl backdrop:bg-black/40"
      >
        {selected && (
          <div className="p-6">
            <p className="text-xs text-muted">{fmtDay(selected.createdAt)}</p>
            <h2 id="update-title" className="mt-1 text-lg font-semibold text-deep">{selected.title}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{selected.body}</p>
            <form method="dialog" className="mt-6 text-right">
              <button className="btn-primary">Close</button>
            </form>
          </div>
        )}
      </dialog>
    </div>
  );
}

const fmtDay = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
