import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { mockHistory } from "@/lib/analytics";
import { fmtSec, PACE_TONE, paceOf } from "@/lib/exam/speed";
import { SECTION_LABELS, type SectionId } from "@/lib/questions";
import { fmtDateTime } from "@/components/admin/when";

export const metadata: Metadata = { title: "Mock history" };

export default async function HistoryPage() {
  const user = await requireUser();
  const mocks = (await mockHistory(user.id)).reverse(); // newest first
  const best = Math.max(0, ...mocks.map((m) => (m.maxScore ? m.score / m.maxScore : 0)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mock history</h1>
        <p className="text-muted">
          {mocks.length ? `${mocks.length} mock${mocks.length === 1 ? "" : "s"} attempted · best ${Math.round(best * 100)}%` : "Every mock you finish shows up here."}
        </p>
      </div>

      {mocks.length === 0 ? (
        <div className="rounded-2xl border border-deep/10 bg-surface p-6 text-sm">
          No mocks yet.{" "}
          <Link href="/mock" className="font-semibold text-brand-dark hover:underline">
            Take your first mock →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {mocks.map((m) => {
            const pct = m.maxScore ? Math.round((m.score / m.maxScore) * 100) : 0;
            const sections = (Object.entries(m.bySection) as [SectionId, { correct: number; total: number }][]).filter(([, s]) => s.total);
            return (
              <li key={m.id} className="rounded-2xl border border-deep/10 bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-sm text-muted">{fmtDateTime(m.submittedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">{pct}%</p>
                    <p className="text-sm tabular-nums text-muted">
                      {m.score}/{m.maxScore}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {sections.map(([s, v]) => (
                    <span key={s}>
                      <span className="text-muted">{SECTION_LABELS[s]}</span> <span className="tabular-nums">{v.correct}/{v.total}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {m.speed && (
                      <span>
                        <span className="text-muted">Speed</span> <span className={`tabular-nums ${PACE_TONE[paceOf(m.speed)]}`}>{fmtSec(m.speed.avgSec)}/question</span>
                      </span>
                    )}
                    {m.violations > 0 && <span className="text-red-700">{m.violations} warning{m.violations === 1 ? "" : "s"}</span>}
                    {m.autoSubmitted && <span className="text-amber-700">Auto-submitted</span>}
                  </div>
                  <Link href={`/results/${m.id}`} className="font-semibold text-brand-dark hover:underline">
                    Review answers →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
