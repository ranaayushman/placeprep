"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type TrackProblem = { id: string; title: string; difficulty: string; tags: string[] };
export type TrackTopic = { name: string; problems: TrackProblem[] };

/** Same store as the code workspace: an Accepted submission saved in this browser marks a problem solved. */
const isSolved = (id: string) => {
  try {
    return (JSON.parse(localStorage.getItem(`code:subs:${id}`) ?? "[]") as { label: string }[]).some((s) => s.label === "Accepted");
  } catch {
    return false;
  }
};

export function DsaTrack({ topics }: { topics: TrackTopic[] }) {
  const [solved, setSolved] = useState<Set<string> | null>(null);
  useEffect(() => setSolved(new Set(topics.flatMap((t) => t.problems.map((p) => p.id)).filter(isSolved))), [topics]);

  const all = topics.flatMap((t) => t.problems);
  const done = solved ? all.filter((p) => solved.has(p.id)).length : 0;
  const next = solved ? all.find((p) => !solved.has(p.id)) : all[0];

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center gap-4">
        <div className="min-w-48 flex-1 space-y-2">
          <p className="text-sm font-medium text-muted">Progress</p>
          <p className="text-2xl font-bold text-deep">
            {done} <span className="text-base font-medium text-muted">/ {all.length} solved</span>
          </p>
          <Bar value={all.length ? done / all.length : 0} />
        </div>
        {next ? (
          <Link href={`/code/${next.id}`} className="btn-primary">
            {done ? "Continue" : "Start"}: {next.title} →
          </Link>
        ) : (
          <p className="font-semibold text-success">All caught up. New problems are on the way.</p>
        )}
      </div>

      {topics.map((t) => {
        const tDone = solved ? t.problems.filter((p) => solved.has(p.id)).length : 0;
        return (
          <section key={t.name} className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-deep">{t.name}</h2>
              <span className="text-xs text-muted">{tDone}/{t.problems.length}</span>
              <div className="w-32"><Bar value={tDone / t.problems.length} /></div>
            </div>
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {t.problems.map((p, i) => (
                <li key={p.id}>
                  <Link href={`/code/${p.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-brand-soft">
                    <span className="w-5 text-center text-sm text-emerald-600">{solved?.has(p.id) ? "✓" : ""}</span>
                    <span className="w-6 text-sm text-slate-400">{i + 1}.</span>
                    <span className="flex-1 font-medium">{p.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{p.difficulty}</span>
                    <span className="text-xs text-slate-500">{p.tags.join(" · ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-brand-soft" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
