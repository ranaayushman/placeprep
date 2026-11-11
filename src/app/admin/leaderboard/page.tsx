import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { leaderboard } from "@/lib/admin";
import { listExams } from "@/lib/exam/exams";
import { pct } from "@/components/charts";
import { fmtDate } from "@/components/admin/when";
import { fmtSec } from "@/lib/exam/speed";

export const dynamic = "force-dynamic";

export default async function AdminLeaderboard({ searchParams }: { searchParams: Promise<{ exam?: string; by?: string }> }) {
  await requireAdmin(); // the layout also lets moderators in
  const { exam: raw, by: rawBy } = await searchParams;
  const by = rawBy === "attempted" ? "attempted" : "score";
  const EXAMS = await listExams();
  const exam = by === "score" ? EXAMS.find((e) => e.id === raw) : undefined;
  const rows = await leaderboard(exam?.id, by);
  const ranked = rows.filter((r) => r.rank != null).length;
  const tabs = [{ id: undefined, label: "All mocks" }, ...EXAMS.map((e) => ({ id: e.id, label: e.short }))];
  const chip = (active: boolean) => `rounded-md px-3 py-1.5 font-medium ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-slate-500">
          {by === "attempted"
            ? "Students ranked by how many questions they have answered, in mocks and practice (finished or not). Accuracy is over the graded ones."
            : <>Students ranked by average mock score (best mock breaks ties). Auto-submitted mocks count too.{!exam && " Students who only did practice sets are listed after, unranked."}</>}
        </p>
      </div>
      <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Rank by">
        <span className="text-slate-500">Rank by</span>
        <Link href="/admin/leaderboard" className={chip(by === "score")}>Mock score</Link>
        <Link href="/admin/leaderboard?by=attempted" className={chip(by === "attempted")}>Questions attempted</Link>
      </nav>
      {by === "score" && <nav className="flex flex-wrap gap-2 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.id ? `/admin/leaderboard?exam=${t.id}` : "/admin/leaderboard"}
            className={`rounded-md px-3 py-1.5 font-medium ${exam?.id === t.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>}
      <p className="text-sm text-slate-600">
        {by === "attempted" ? `${rows.length} students` : `${ranked} ranked · ${rows.length - ranked} practice only`}
        {rows.length === 500 ? " · showing the first 500" : ""}
      </p>
      {rows.length === 0 ? (
        <p className="card text-sm text-slate-500">No finished tests yet.</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">College</th>
                <th className={`px-3 py-2 text-right ${by === "attempted" ? "text-slate-900" : ""}`}>Questions answered</th>
                <th className="px-3 py-2 text-right">Accuracy</th>
                <th className="px-3 py-2 text-right">Mocks</th>
                <th className="px-3 py-2 text-right">Avg</th>
                <th className="px-3 py-2 text-right">Best</th>
                <th className="px-3 py-2 text-right" title="Average seconds per answered mock question">Mock speed</th>
                <th className="px-3 py-2">Last mock</th>
                <th className="px-3 py-2 text-right">Practice answered</th>
                <th className="px-3 py-2 text-right">Practice accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-semibold tabular-nums">{r.rank ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${r.id}`} className="font-medium text-slate-900 hover:underline">{r.name}</Link>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.college ?? "—"}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${by === "attempted" ? "font-semibold" : ""}`}>{r.totalAnswered || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(r.totalAcc)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.mocks || "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{pct(r.avgPct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(r.bestPct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.mockSecPerQ != null ? `${fmtSec(r.mockSecPerQ)}/q` : "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{r.lastMockAt ? fmtDate(r.lastMockAt) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.practiceAnswered || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(r.practiceAcc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
