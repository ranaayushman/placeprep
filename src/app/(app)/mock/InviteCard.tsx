"use client";

import { useState } from "react";
import { LockIcon } from "@/components/LockIcon";

/** Shown instead of "Continue" on an invite-to-unlock mock: the student's link, share buttons and progress. */
export function InviteCard({ link, have, need }: { link: string; have: number; need: number }) {
  const [copied, setCopied] = useState(false);
  const text = `I'm preparing for placements on PlacePrep: free full mocks for Cognizant, Infosys, Deloitte and more. Join with my link: ${link}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (http, old browser): the link is still selectable in the box.
    }
  };
  return (
    <div className="card space-y-4 border-brand/30">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><LockIcon size={16} className="text-brand-dark" />Invite {need} friends to unlock this mock</h2>
        <p className="mt-1 text-sm text-slate-600">
          Share your link. When a friend signs up with it and finishes their profile, it counts. {need} friends unlock both GenC Extreme mocks for good.
        </p>
      </div>
      <div className="flex items-center gap-3" aria-label={`${have} of ${need} friends joined`}>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (have / need) * 100)}%` }} />
        </div>
        <span className="text-sm font-medium tabular-nums text-slate-700">{have} / {need} joined</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Your invite link" className="input min-w-0 flex-1 text-sm" />
        <button type="button" onClick={copy} className="btn-primary px-4">{copied ? "Copied" : "Copy link"}</button>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:border-brand">
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
