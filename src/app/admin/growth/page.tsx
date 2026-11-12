import { requireAdmin } from "@/lib/auth";
import { dailyGrowth, retentionCohorts, signupFunnel } from "@/lib/admin";
import { fmtDate } from "@/components/admin/when";
import { DailyBars } from "@/components/admin/DailyBars";

export const dynamic = "force-dynamic";

const pctOf = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default async function GrowthPage() {
  await requireAdmin();
  const [recent, allTime, cohorts, daily] = await Promise.all([signupFunnel(Date.now() - 30 * 86_400_000), signupFunnel(0), retentionCohorts(), dailyGrowth(30)]);
  const total = (k: "signups" | "active") => daily.reduce((a, d) => a + d[k], 0);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Growth</h1>
        <p className="text-sm text-slate-500">Where students drop off after signing up, and how many come back. Students only; admins and moderators are left out.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-semibold">New sign-ups per day</h2>
          <p className="mt-1 text-xs text-slate-500">Last 30 days (IST) · {total("signups")} students in total. Hover a bar for the exact number.</p>
          <div className="mt-3"><DailyBars data={daily.map((d) => ({ day: d.day, n: d.signups }))} label="New student sign-ups per day, last 30 days" unit="sign-ups" /></div>
        </section>
        <section className="card">
          <h2 className="font-semibold">Active students per day</h2>
          <p className="mt-1 text-xs text-slate-500">Students who started a practice set or mock that day (IST). Hover a bar for the exact number.</p>
          <div className="mt-3"><DailyBars data={daily.map((d) => ({ day: d.day, n: d.active }))} label="Active students per day, last 30 days" unit="active students" /></div>
        </section>
      </div>

      <section className="card overflow-x-auto">
        <h2 className="font-semibold">Sign-up funnel</h2>
        <p className="mt-1 text-xs text-slate-500">Last 30 days: share of new sign-ups who reached each step.</p>
        <div className="mt-3 space-y-2">
          {recent.map((s) => (
            <div key={s.label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[14rem_1fr_6rem]">
              <span>{s.label}</span>
              <div className="col-span-2 row-start-2 h-3 rounded bg-slate-100 sm:col-span-1 sm:row-start-auto">
                <div className="h-full rounded" style={{ width: `${recent[0].n ? (s.n / recent[0].n) * 100 : 0}%`, backgroundColor: "#2a78d6" }} />
              </div>
              <span className="text-right tabular-nums"><span className="font-semibold">{s.n}</span> <span className="text-slate-500">{pctOf(s.n, recent[0].n)}</span></span>
            </div>
          ))}
        </div>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="py-2">Step</th><th className="py-2 text-right">Last 30 days</th><th className="py-2 text-right">of sign-ups</th><th className="py-2 text-right">All time</th><th className="py-2 text-right">of sign-ups</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recent.map((s, i) => (
              <tr key={s.label}>
                <td className="py-2">
                  {s.label}
                  {i > 0 && i < recent.length - 1 && recent[i - 1].n > 0 && <span className="ml-2 text-xs text-slate-400">({pctOf(s.n, recent[i - 1].n)} of the step before)</span>}
                </td>
                <td className="py-2 text-right font-semibold tabular-nums">{s.n}</td>
                <td className="py-2 text-right tabular-nums text-slate-500">{pctOf(s.n, recent[0].n)}</td>
                <td className="py-2 text-right tabular-nums">{allTime[i].n}</td>
                <td className="py-2 text-right tabular-nums text-slate-500">{pctOf(allTime[i].n, allTime[0].n)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-400">Each step counts students who also did every step above it. &quot;Came back&quot; is counted on its own: they used the site on a later day than they signed up.</p>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="font-semibold">Weekly retention</h2>
        <p className="mt-1 text-xs text-slate-500">Students grouped by the week they signed up (IST). Each cell: how many started a test in that week after signing up. Blank until the week is over.</p>
        {cohorts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No sign-ups in the last 8 weeks.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="py-2">Signed up week of</th><th className="py-2 text-right">Students</th>{[1, 2, 3, 4].map((w) => <th key={w} className="py-2 text-right">Week {w}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cohorts.map((c) => (
                <tr key={c.weekStart.getTime()}>
                  <td className="py-2">{fmtDate(c.weekStart)}</td>
                  <td className="py-2 text-right tabular-nums">{c.size}</td>
                  {c.weeks.map((v, k) => (
                    <td key={k} className="py-2 text-right tabular-nums" style={v != null && c.size ? { backgroundColor: `rgba(16,185,129,${(0.6 * v) / c.size})` } : undefined}>
                      {v == null ? "" : `${pctOf(v, c.size)}`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
