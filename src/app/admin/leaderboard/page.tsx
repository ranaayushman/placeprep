import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { leaderboard } from "@/lib/admin";
import { EXAMS } from "@/lib/exam/pattern";
import { pct } from "@/components/charts";
import { fmtDate } from "@/components/admin/when";

export const dynamic = "force-dynamic";

export default async function AdminLeaderboard({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  await requireAdmin(); // the layout also lets moderators in
  const { exam: raw } = await searchParams;
  const exam = EXAMS.find((e) => e.id === raw);
  const rows = await leaderboard(exam?.id);
  const ranked = rows.filter((r) => r.rank != null).length;
  const tabs = [{ id: undefined, label: "All mocks" }, ...EXAMS.map((e) => ({ id: e.id, label: e.short }))];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-slate-500">
          Students ranked by average mock score (best mock breaks ties). Auto-submitted mocks count too.
          {!exam && " Students who only did practice sets are listed after, unranked."}
        </p>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.id ? `/admin/leaderboard?exam=${t.id}` : "/admin/leaderboard"}
            className={`rounded-md px-3 py-1.5 font-medium ${exam?.id === t.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-slate-600">
        {ranked} ranked · {rows.length - ranked} practice only{rows.length === 500 ? " · showing the first 500" : ""}
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
                <th className="px-3 py-2 text-right">Mocks</th>
                <th className="px-3 py-2 text-right">Avg</th>
                <th className="px-3 py-2 text-right">Best</th>
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
                  <td className="px-3 py-2 text-right tabular-nums">{r.mocks || "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{pct(r.avgPct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(r.bestPct)}</td>
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
