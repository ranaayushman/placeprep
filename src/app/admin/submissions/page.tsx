import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SUBMISSION_WINDOWS, submittedMocks, type SubmissionWindow } from "@/lib/admin";
import { listExams } from "@/lib/exam/exams";
import { pct } from "@/components/charts";
import { fmtDateTime } from "@/components/admin/when";

export const dynamic = "force-dynamic";

const WINDOW_LABELS: Record<SubmissionWindow, string> = { "24h": "Last 24 h", "7d": "7 days", "30d": "30 days", all: "All time" };

export default async function SubmittedMocksPage({ searchParams }: { searchParams: Promise<{ window?: string; exam?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const window = (sp.window && sp.window in SUBMISSION_WINDOWS ? sp.window : "all") as SubmissionWindow;
  const exams = await listExams();
  const exam = exams.find((e) => e.id === sp.exam);
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, pages } = await submittedMocks({ window, exam: exam?.id, page });
  const link = (o: { window?: string; exam?: string; page?: number }) => {
    const q = new URLSearchParams();
    const w = o.window ?? window;
    const e = "exam" in o ? o.exam : exam?.id;
    if (w !== "all") q.set("window", w);
    if (e) q.set("exam", e);
    if (o.page && o.page > 1) q.set("page", String(o.page));
    return `/admin/submissions${q.size ? `?${q}` : ""}`;
  };
  const chip = (active: boolean) => `rounded-md px-3 py-1.5 font-medium ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Submitted mocks</h1>
        <p className="text-sm text-slate-500">Every finished mock, newest first. Auto means it ended on proctoring warnings or because the student left; Finished means they submitted it or the timer ran out.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {(Object.keys(WINDOW_LABELS) as SubmissionWindow[]).map((w) => (
          <Link key={w} href={link({ window: w })} className={chip(w === window)}>{WINDOW_LABELS[w]}</Link>
        ))}
        <span className="mx-1 self-center text-slate-300">|</span>
        <Link href={link({ exam: undefined })} className={chip(!exam)}>All exams</Link>
        {exams.map((e) => (
          <Link key={e.id} href={link({ exam: e.id })} className={chip(exam?.id === e.id)}>{e.short}</Link>
        ))}
      </div>
      <p className="text-sm text-slate-600">{total} mock{total === 1 ? "" : "s"}</p>

      {rows.length === 0 ? (
        <p className="card text-sm text-slate-500">No submitted mocks here.</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Submitted</th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Mock</th>
                <th className="px-3 py-2 text-right">Score</th>
                <th className="px-3 py-2 text-right">Time taken</th>
                <th className="px-3 py-2 text-right">Warnings</th>
                <th className="px-3 py-2">Ended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">{fmtDateTime(r.submittedAt)}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${r.userId}`} className="font-medium text-slate-900 hover:underline">{r.name}</Link>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{r.title}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <b>{r.score}/{r.maxScore}</b> <span className="text-slate-500">({pct(r.maxScore ? r.score / r.maxScore : null)})</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">{Math.max(1, Math.round((r.submittedAt.getTime() - r.startedAt.getTime()) / 60_000))} min</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${r.violations ? "text-red-600" : ""}`}>
                    {r.violations}{r.cameraAlerts ? <span className="text-xs text-amber-700"> · {r.cameraAlerts} cam</span> : null}
                  </td>
                  <td className="px-3 py-2">
                    {r.autoSubmitted ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Auto</span> : <span className="text-xs text-slate-500">Finished</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-between">
        {page > 1 ? <Link href={link({ page: page - 1 })} className="btn-secondary">← Newer</Link> : <span />}
        <span className="self-center text-sm text-slate-500">Page {page} of {pages}</span>
        {page < pages ? <Link href={link({ page: page + 1 })} className="btn-secondary">Older →</Link> : <span />}
      </div>
    </div>
  );
}
