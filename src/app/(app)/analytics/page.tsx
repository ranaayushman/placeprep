import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { activityByDay, getTopicStats, mockHistory, sectionStats } from "@/lib/analytics";
import { SECTION_LABELS, type SectionId } from "@/lib/questions";
import { LineChart, ProgressBar, pct } from "@/components/charts";

const SECTIONS: SectionId[] = ["reasoning", "math", "verbal", "pseudocode", "puzzle"];

export default async function AnalyticsPage() {
  const user = await requireUser();
  const [stats, history, activity] = await Promise.all([getTopicStats(user.id), mockHistory(user.id), activityByDay(user.id)]);
  const sections = sectionStats(stats);

  const maxDay = Math.max(1, ...activity.map((d) => d.n));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-slate-500">Accuracy, speed and progress across every section and topic.</p>
      </div>

      <section className="card">
        <h2 className="font-semibold">Mock score trend</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No mocks yet. <Link className="text-indigo-600 hover:underline" href="/mock">Take your first one</Link> to see your trend.</p>
        ) : (
          <>
            <LineChart points={history.map((h, i) => ({ label: `#${i + 1}`, value: h.maxScore ? h.score / h.maxScore : 0 }))} />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr><th className="py-2">Mock</th>{SECTIONS.map((s) => <th key={s} className="py-2">{SECTION_LABELS[s].split(" ")[0]}</th>)}<th className="py-2">Total</th><th className="py-2">Warnings</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.slice().reverse().map((h) => (
                    <tr key={h.id}>
                      <td className="py-2"><Link href={`/results/${h.id}`} className="text-indigo-600 hover:underline">{h.title}</Link></td>
                      {SECTIONS.map((s) => <td key={s} className="py-2 tabular-nums">{h.bySection[s].total ? `${h.bySection[s].correct}/${h.bySection[s].total}` : "—"}</td>)}
                      <td className="py-2 font-semibold tabular-nums">{h.score}/{h.maxScore}</td>
                      <td className={`py-2 tabular-nums ${h.violations ? "text-red-600" : ""}`}>{h.violations}{h.autoSubmitted ? " (auto)" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold">Last 14 days</h2>
        <div className="mt-4 flex h-28 items-end gap-1.5">
          {activity.map(({ day, n }) => (
            <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${day}: ${n} questions`}>
              <div className="w-full rounded-t bg-indigo-500" style={{ height: `${(n / maxDay) * 100}%`, minHeight: n ? 4 : 0 }} />
              <span className="text-[10px] text-slate-400">{Number(day.slice(8))}</span>
            </div>
          ))}
        </div>
      </section>

      {SECTIONS.map((section) => {
        const s = sections.find((x) => x.section === section)!;
        const ts = stats.filter((t) => t.section === section).sort((a, b) => a.mastery - b.mastery);
        return (
          <section key={section} className="card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{SECTION_LABELS[section]}</h2>
              <p className="text-sm text-slate-500">
                {s.attempted} answered · accuracy {pct(s.accuracy)} · target {pct(s.target)}
              </p>
            </div>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr><th className="py-1.5">Topic</th><th className="w-1/3 py-1.5">Recent form</th><th className="py-1.5">Accuracy</th><th className="py-1.5">Avg time</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ts.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2">{t.label}{t.weight >= 3 && <span className="ml-1.5 text-[10px] font-semibold text-indigo-600">FREQUENT</span>}</td>
                    <td className="py-2 pr-4"><ProgressBar value={t.attempted ? t.mastery : null} target={s.target} /></td>
                    <td className="py-2 tabular-nums">{t.attempted ? `${pct(t.accuracy)} (${t.correct}/${t.attempted})` : <span className="text-slate-400">—</span>}</td>
                    <td className={`py-2 tabular-nums ${t.avgSec && t.avgSec > t.targetSec * 1.4 ? "text-amber-600" : ""}`}>
                      {t.avgSec ? `${Math.round(t.avgSec)}s` : "—"} <span className="text-xs text-slate-400">/ {t.targetSec}s</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
