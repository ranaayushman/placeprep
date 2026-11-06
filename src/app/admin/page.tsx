import Link from "next/link";
import { adminOverview, FLAG_VIOLATIONS_7D } from "@/lib/admin";
import { ago } from "@/components/admin/when";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const { counts, live, flagged, signupSeries } = await adminOverview();
  const maxSignup = Math.max(1, ...signupSeries.map((d) => d.c));
  const tiles = [
    { label: "Students", value: counts.students, sub: `+${counts.new7d} this week` },
    { label: "Online now", value: counts.online, sub: `${counts.active24h} active in 24 h`, tone: "text-emerald-600" },
    { label: "Mocks submitted (24 h)", value: counts.mocks24h, sub: `${counts.answers24h} answers saved` },
    { label: "Warnings (24 h)", value: counts.violations24h, sub: `${counts.failedLogins24h} failed logins`, tone: counts.violations24h ? "text-amber-600" : "" },
    { label: "Blocked", value: counts.blocked, sub: "on the block list", tone: counts.blocked ? "text-red-600" : "" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="card">
            <p className="text-sm text-slate-500">{t.label}</p>
            <p className={`mt-1 text-3xl font-bold tabular-nums ${t.tone ?? ""}`}>{t.value}</p>
            <p className="mt-1 text-xs text-slate-400">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Mocks in progress</h2>
            <span className="text-xs text-slate-400">refresh to update</span>
          </div>
          {live.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No one is taking a mock right now.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-slate-500"><tr><th className="py-1.5">Student</th><th>Section</th><th>Started</th><th className="text-right">Warnings</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {live.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2"><Link href={`/admin/users/${l.user_id}`} className="font-medium text-indigo-600 hover:underline">{l.name}</Link></td>
                    <td className="py-2 text-slate-600">{l.sectionLabel}</td>
                    <td className="py-2 text-slate-500">{ago(l.startedAt)}</td>
                    <td className={`py-2 text-right font-semibold tabular-nums ${l.violations ? "text-red-600" : "text-slate-400"}`}>{l.violations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className="font-semibold">Flagged for review</h2>
          <p className="text-sm text-slate-500">{FLAG_VIOLATIONS_7D}+ proctoring warnings, or an auto-submitted mock, in the last 7 days.</p>
          {flagged.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing suspicious this week.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {flagged.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2">
                  <div>
                    <Link href={`/admin/users/${f.id}`} className="font-medium text-indigo-600 hover:underline">{f.name}</Link>
                    <span className="ml-2 text-slate-400">{f.email}</span>
                    {f.blocked_at && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">BLOCKED</span>}
                  </div>
                  <span className="text-right text-xs text-slate-500">
                    <b className="text-red-600">{f.v7d}</b> warnings{f.auto7d ? ` · ${f.auto7d} auto-submit` : ""} · {ago(f.lastViolation)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <h2 className="font-semibold">Sign-ups, last 14 days</h2>
        <div className="mt-4 flex h-28 items-end gap-1.5">
          {signupSeries.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.c}`}>
              <span className="text-[10px] tabular-nums text-slate-500">{d.c || ""}</span>
              <div className="w-full rounded-t bg-indigo-500" style={{ height: `${(d.c / maxSignup) * 80}%`, minHeight: d.c ? 4 : 0 }} />
              <span className="text-[10px] text-slate-400">{Number(d.day.slice(8))}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
