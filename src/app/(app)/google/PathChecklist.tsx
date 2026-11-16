"use client";

import { useEffect, useState } from "react";
import type { PathPhase } from "@/lib/google-path";

// shortcut: progress lives in this browser only (localStorage); move it to the DB if it must follow you across devices.
const KEY = "placeprep.googlePath.done";
const LEVEL_TONE = { Easy: "text-emerald-700", Medium: "text-amber-700", Hard: "text-red-700" } as const;

export function PathChecklist({ phases, total }: { phases: PathPhase[]; total: number }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      setDone(new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]));
    } catch {
      // Storage blocked or corrupted: start empty.
    }
  }, []);
  const toggle = (slug: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {
        // Private mode: ticks still work for this visit.
      }
      return next;
    });

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-3" aria-label={`${done.size} of ${total} problems done`}>
        <span className="text-sm font-semibold">Progress</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand" style={{ width: `${(done.size / total) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-slate-600">{done.size} / {total}</span>
      </div>

      {phases.map((ph, i) => {
        const slugs = ph.topics.flatMap((t) => t.problems.map((p) => p.slug));
        const phaseDone = slugs.filter((s) => done.has(s)).length;
        return (
          <section key={ph.id} id={ph.id} className="card scroll-mt-20 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">
                {i + 1}. {ph.title} <span className="ml-1 text-sm font-medium text-slate-500">{ph.weeks}</span>
              </h2>
              {slugs.length > 0 && <span className="text-sm tabular-nums text-slate-500">{phaseDone} / {slugs.length}</span>}
            </div>
            <p className="text-sm text-slate-700">{ph.goal}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {ph.habits.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            {ph.topics.map((t) => (
              <div key={t.name}>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-xs text-slate-500">{t.why}</p>
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {t.problems.map((p) => (
                    <li key={p.slug} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <input type="checkbox" checked={done.has(p.slug)} onChange={() => toggle(p.slug)} aria-label={`Mark ${p.title} done`} className="h-4 w-4 shrink-0 accent-brand" />
                      <a href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noopener noreferrer" className={`flex-1 hover:underline ${done.has(p.slug) ? "text-slate-400 line-through" : ""}`}>
                        {p.title}
                      </a>
                      <span className={`text-xs font-medium ${LEVEL_TONE[p.level]}`}>{p.level}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
