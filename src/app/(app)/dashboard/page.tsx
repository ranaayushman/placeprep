import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { attempts, db } from "@/db";
import { requireUser } from "@/lib/auth";
import { getTopicStats, mockHistory, recommend, sectionStats } from "@/lib/analytics";
import { wrongRefs } from "@/lib/exam/service";
import { ProgressBar, pct } from "@/components/charts";
import { retryMistakes, startPractice } from "../start-actions";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const { error } = await searchParams;
  const [stats, history, wrong, recent] = await Promise.all([
    getTopicStats(user.id),
    mockHistory(user.id),
    wrongRefs(user.id, 50),
    db.select().from(attempts).where(eq(attempts.userId, user.id)).orderBy(desc(attempts.startedAt)).limit(8),
  ]);
  const sections = sectionStats(stats);
  const recs = recommend(stats, history, wrong.length).slice(0, 5);
  const inProgress = recent.filter((a) => a.status === "IN_PROGRESS");
  const answered = stats.reduce((a, t) => a + t.attempted, 0);
  const correct = stats.reduce((a, t) => a + t.correct, 0);
  const best = history.reduce((m, h) => Math.max(m, h.maxScore ? h.score / h.maxScore : 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hi {user.name.split(" ")[0]}</h1>
          <p className="text-slate-500">Here&apos;s where you stand and what to do next.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/practice" className="btn-secondary">Practice</Link>
          <Link href="/mock" className="btn-primary">Start full mock</Link>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {inProgress.length > 0 && (
        <div className="card border-amber-300 bg-amber-50">
          <p className="font-semibold text-amber-900">Unfinished</p>
          <ul className="mt-2 space-y-1 text-sm">
            {inProgress.map((a) => (
              <li key={a.id} className="flex items-center justify-between">
                <span>{a.title}{a.mode === "MOCK" && " — the timer keeps running while you're away"}</span>
                <Link href={`/attempt/${a.id}`} className="font-semibold text-indigo-700 hover:underline">Resume →</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-slate-500">Questions answered</p><p className="mt-1 text-3xl font-bold tabular-nums">{answered}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Overall accuracy</p><p className="mt-1 text-3xl font-bold tabular-nums">{answered ? pct(correct / answered) : "—"}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Mocks taken · best</p><p className="mt-1 text-3xl font-bold tabular-nums">{history.length} · {history.length ? pct(best) : "—"}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <h2 className="font-semibold">Recommended for you</h2>
          <p className="text-sm text-slate-500">Ranked by how often a topic appears in the paper and how shaky you are on it.</p>
          <ul className="mt-4 divide-y divide-slate-100">
            {recs.map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-slate-500">{r.reason}</p>
                </div>
                {r.topicIds?.length ? (
                  <form action={startPractice}>
                    {r.topicIds.map((t) => <input key={t} type="hidden" name="topic" value={t} />)}
                    <input type="hidden" name="count" value="12" />
                    <button className="btn-secondary whitespace-nowrap">Start 12</button>
                  </form>
                ) : r.topicId ? (
                  <form action={startPractice}>
                    <input type="hidden" name="topic" value={r.topicId} />
                    <input type="hidden" name="count" value="10" />
                    {r.kind === "speed" && <input type="hidden" name="timed" value="on" />}
                    <button className="btn-secondary whitespace-nowrap">Start 10</button>
                  </form>
                ) : r.kind === "mistakes" ? (
                  <form action={retryMistakes}><button className="btn-secondary whitespace-nowrap">Retry</button></form>
                ) : (
                  <Link href="/mock" className="btn-secondary whitespace-nowrap">Open</Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="card lg:col-span-2">
          <h2 className="font-semibold">Section readiness</h2>
          <p className="text-sm text-slate-500">Recent form, weighted by topic frequency. The line marks the practice target.</p>
          <ul className="mt-4 space-y-4">
            {sections.map((s) => (
              <li key={s.section}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{s.label}</span>
                  <span className="tabular-nums text-slate-500">{s.attempted ? pct(s.readiness) : "not started"}</span>
                </div>
                <ProgressBar value={s.attempted ? s.readiness : null} target={s.target} label={`${s.label} readiness`} />
                <p className="mt-1 text-xs text-slate-400">{Math.round(s.coverage * 100)}% of topics practised</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2 className="font-semibold">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing yet. Start with a short practice set or a diagnostic mock.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {recent.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 font-medium">{a.title}</td>
                  <td className="py-2 text-slate-500">{a.startedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  <td className="py-2 tabular-nums">{a.status === "SUBMITTED" ? `${a.score}/${a.maxScore}` : "in progress"}</td>
                  <td className="py-2 text-right">
                    <Link href={a.status === "SUBMITTED" ? `/results/${a.id}` : `/attempt/${a.id}`} className="text-indigo-600 hover:underline">
                      {a.status === "SUBMITTED" ? "Review" : "Resume"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

