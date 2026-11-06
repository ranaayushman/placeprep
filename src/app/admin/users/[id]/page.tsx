import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { describeEvent, userDetail } from "@/lib/admin";
import { getTopicStats, sectionStats } from "@/lib/analytics";
import { ProgressBar, pct } from "@/components/charts";
import { ago, fmtDate, fmtDateTime, isOnline } from "@/components/admin/when";
import { blockUser, revokeSessions, setRole, unblockUser } from "../../actions";

export const dynamic = "force-dynamic";

const EVENT_TONE: Record<string, string> = {
  violation: "bg-red-100 text-red-700",
  login_failed: "bg-amber-100 text-amber-800",
  login_blocked: "bg-red-100 text-red-700",
  rate_limited: "bg-amber-100 text-amber-800",
  mock_submitted: "bg-emerald-100 text-emerald-700",
};

export default async function AdminUserDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { msg } = await searchParams;
  const data = await userDetail(id);
  if (!data) notFound();
  const { user, attempts, events, actions, ips } = data;
  const sections = sectionStats(await getTopicStats(id));
  const isSelf = user.id === admin.id;
  const violationEvents = events.filter((e) => e.type === "violation");

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-900">← All users</Link>
      {msg && <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-900">{msg}</div>}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {user.name}
            {user.blockedAt && <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">BLOCKED</span>}
            {user.role === "ADMIN" && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">ADMIN</span>}
          </h1>
          <p className="text-slate-500">{user.email}</p>
          <p className="mt-1 text-sm text-slate-500">
            Joined {fmtDate(user.createdAt)} · Last seen{" "}
            {isOnline(user.lastSeenAt) ? <span className="font-medium text-emerald-600">online now</span> : ago(user.lastSeenAt)} · {user.sessions} active session(s)
            {user.google ? " · Google sign-in" : ""}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {user.college
              ? `${user.college} · ${user.degree} ${user.branch} · Class of ${user.passout_year}${user.dream_company ? ` · Dream: ${user.dream_company}` : ""}`
              : "Profile not completed yet"}
          </p>
        </div>
      </div>

      {user.blockedAt && (
        <div className="card border-red-200 bg-red-50 text-sm">
          <p className="font-semibold text-red-800">Blocked {fmtDateTime(user.blockedAt)}{user.blocked_by_name ? ` by ${user.blocked_by_name}` : ""}</p>
          <p className="mt-1 text-red-900">Reason: {user.blocked_reason ?? "—"}</p>
        </div>
      )}

      {/* Moderation */}
      {!isSelf && (
        <section className="card">
          <h2 className="font-semibold">Moderation</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {user.blockedAt ? (
              <form action={unblockUser} className="flex gap-2">
                <input type="hidden" name="userId" value={user.id} />
                <input name="reason" placeholder="Note (optional)" className="input w-64" />
                <button className="btn-primary">Unblock</button>
              </form>
            ) : user.role !== "ADMIN" ? (
              <form action={blockUser} className="flex gap-2">
                <input type="hidden" name="userId" value={user.id} />
                <input name="reason" required minLength={3} maxLength={300} placeholder="Reason, e.g. repeated tab switching" className="input w-80" />
                <button className="btn-danger">Block user</button>
              </form>
            ) : null}
            <form action={revokeSessions}>
              <input type="hidden" name="userId" value={user.id} />
              <button className="btn-secondary" disabled={user.sessions === 0}>Sign out everywhere</button>
            </form>
            {!user.blockedAt && (
              <form action={setRole}>
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="role" value={user.role === "ADMIN" ? "STUDENT" : "ADMIN"} />
                <button className="btn-secondary">{user.role === "ADMIN" ? "Remove admin" : "Make admin"}</button>
              </form>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">Blocking signs the user out immediately and stops them logging in. Every action is recorded in the audit log below.</p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-1">
          <h2 className="font-semibold">Preparation</h2>
          <ul className="mt-3 space-y-3">
            {sections.map((s) => (
              <li key={s.section}>
                <div className="mb-1 flex justify-between text-sm"><span>{s.label}</span><span className="tabular-nums text-slate-500">{s.attempted ? `${pct(s.accuracy)} of ${s.attempted}` : "—"}</span></div>
                <ProgressBar value={s.attempted ? s.accuracy : null} target={s.target} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card lg:col-span-2">
          <h2 className="font-semibold">Tests ({attempts.length})</h2>
          <div className="mt-3 max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500"><tr><th className="py-1.5">Test</th><th>Started</th><th>Score</th><th className="text-right">Warnings</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2">{a.title}{a.mode === "MOCK" && <span className="ml-1.5 text-[10px] font-semibold text-indigo-600">MOCK</span>}</td>
                    <td className="py-2 text-slate-500">{fmtDateTime(a.startedAt)}</td>
                    <td className="py-2 tabular-nums">{a.status === "SUBMITTED" ? `${a.score}/${a.max_score}` : <span className="text-amber-600">in progress</span>}</td>
                    <td className={`py-2 text-right tabular-nums ${a.violations ? "font-semibold text-red-600" : "text-slate-400"}`}>
                      {a.violations}{a.auto_submitted ? " · auto" : ""}
                    </td>
                  </tr>
                ))}
                {attempts.length === 0 && <tr><td colSpan={4} className="py-4 text-slate-500">No tests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="font-semibold">Behaviour log</h2>
          <p className="text-sm text-slate-500">Last 100 events · {violationEvents.length} proctoring warning(s)</p>
          <ul className="mt-3 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${EVENT_TONE[e.type] ?? "bg-slate-100 text-slate-600"}`}>{e.type.replace("_", " ")}</span>
                  {describeEvent(e.type, e.meta)}
                  {e.user_agent && <div className="mt-0.5 truncate text-xs text-slate-400" title={e.user_agent}>{e.user_agent}</div>}
                </div>
                <div className="shrink-0 text-right text-xs text-slate-500">
                  {fmtDateTime(e.createdAt)}
                  {e.ip && <div className="font-mono text-slate-400">{e.ip}</div>}
                </div>
              </li>
            ))}
            {events.length === 0 && <li className="py-4 text-slate-500">No activity recorded.</li>}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="card">
            <h2 className="font-semibold">Login IPs</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {ips.map((i) => (
                <li key={i.ip} className="flex justify-between"><span className="font-mono">{i.ip}</span><span className="text-slate-500">{i.count}× · {ago(i.last)}</span></li>
              ))}
              {ips.length === 0 && <li className="text-slate-500">None recorded.</li>}
            </ul>
          </section>
          <section className="card">
            <h2 className="font-semibold">Audit log</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {actions.map((a, i) => (
                <li key={i}>
                  <b>{a.action.replace("_", " ")}</b> by {a.admin_name}
                  <div className="text-xs text-slate-500">{fmtDateTime(a.createdAt)}{a.reason ? ` — ${a.reason}` : ""}</div>
                </li>
              ))}
              {actions.length === 0 && <li className="text-slate-500">No admin actions.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
