import Link from "next/link";
import { MIN_ANSWERS_FOR_STATS, moderatorStats, studentQuestionStats } from "@/lib/community/service";
import { SECTION_LABELS, TOPIC_BY_ID, type SectionId } from "@/lib/questions";
import { pct } from "@/components/charts";

/** A moderator's home: question numbers only (queue, their own work, coverage). No student data. */
export async function ModeratorOverview({ userId, name }: { userId: string; name: string }) {
  const [s, students] = await Promise.all([moderatorStats(userId), studentQuestionStats()]);
  const topicLabel = (id: string) => TOPIC_BY_ID.get(id)?.label ?? id;
  const toReview = (s.queue.FLAGGED_DUPLICATE ?? 0) + (s.queue.PENDING_REVIEW ?? 0) + (s.queue.NEEDS_REVIEW ?? 0);
  const mineTotal = Object.values(s.mine).reduce((a, n) => a + (n ?? 0), 0);
  const maxSection = Math.max(1, ...s.publishedBySection.map((r) => r.n));
  const tiles = [
    { label: "To review", value: toReview, sub: `${s.queue.FLAGGED_DUPLICATE ?? 0} flagged · ${s.queue.PENDING_REVIEW ?? 0} pending · ${s.queue.NEEDS_REVIEW ?? 0} reported`, href: "/admin/community?tab=pending", tone: toReview ? "text-amber-600" : "" },
    { label: "Published", value: s.queue.PUBLISHED ?? 0, sub: `${s.queue.REJECTED ?? 0} rejected so far`, href: "/admin/community?tab=published" },
    { label: "Answer keys to check", value: s.suspiciousKeys, sub: "students mostly pick another option", href: "/admin/community?tab=reported", tone: s.suspiciousKeys ? "text-amber-600" : "" },
    { label: "You reviewed", value: s.reviewed.total, sub: `${s.reviewed.week} in the last 7 days` },
    { label: "You added", value: mineTotal, sub: `${s.mine.PUBLISHED ?? 0} published · ${(s.mine.PENDING_REVIEW ?? 0) + (s.mine.FLAGGED_DUPLICATE ?? 0)} waiting`, href: "/community" },
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hi {name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">Community question numbers. Your own questions need another reviewer to publish them.</p>
        </div>
        <Link href="/community/submit" className="btn-primary">Add a question</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => {
          const body = (
            <>
              <p className="text-sm text-slate-500">{t.label}</p>
              <p className={`mt-1 text-3xl font-bold tabular-nums ${t.tone ?? ""}`}>{t.value}</p>
              <p className="mt-1 text-xs text-slate-400">{t.sub}</p>
            </>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="card hover:border-slate-400">{body}</Link>
          ) : (
            <div key={t.label} className="card">{body}</div>
          );
        })}
      </div>
      <section className="card">
        <h2 className="font-semibold">Published questions by section</h2>
        {s.publishedBySection.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nothing published yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {s.publishedBySection.map((r) => (
              <li key={r.section} className="grid grid-cols-[10rem_1fr_3rem] items-center gap-3">
                <span>{SECTION_LABELS[r.section as SectionId] ?? r.section}</span>
                <span className="h-2 rounded bg-slate-100">
                  <span className="block h-2 rounded bg-slate-700" style={{ width: `${(r.n / maxSection) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums">{r.n}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-400">Short bars are the sections that need questions most.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-semibold">Where students struggle</h2>
          <p className="mt-1 text-xs text-slate-500">Lowest accuracy over the last 30 days, all students together. Good topics to write questions and clear explanations for.</p>
          {students.weakTopics.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Not enough answers yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {students.weakTopics.map((t) => (
                  <tr key={t.topic}>
                    <td className="py-2">{topicLabel(t.topic)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-500">{t.answers} answers</td>
                    <td className={`py-2 text-right font-semibold tabular-nums ${t.accuracy < 0.4 ? "text-red-600" : ""}`}>{pct(t.accuracy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="card">
          <h2 className="font-semibold">How community questions perform</h2>
          <p className="mt-1 text-xs text-slate-500">Most-answered published questions. Very low accuracy can mean a wrong key or an unclear question; very high can mean it&apos;s too easy.</p>
          {students.community.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No question has {MIN_ANSWERS_FOR_STATS} answers yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {students.community.map((q) => (
                  <tr key={q.id}>
                    <td className="max-w-0 py-2">
                      <Link href={`/admin/community/${q.id}`} className="block truncate hover:underline">{q.stem}</Link>
                      <span className="text-xs text-slate-400">{topicLabel(q.topic)}</span>
                    </td>
                    <td className="py-2 pl-3 text-right tabular-nums whitespace-nowrap text-slate-500">{q.answers} answers</td>
                    <td className={`py-2 pl-3 text-right font-semibold tabular-nums ${q.accuracy < 0.3 ? "text-red-600" : ""}`}>{pct(q.accuracy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
      <p className="text-xs text-slate-400">
        Student numbers are totals across everyone; a topic or question appears only after {MIN_ANSWERS_FOR_STATS} answers, so no single student can be identified.
      </p>
    </div>
  );
}
