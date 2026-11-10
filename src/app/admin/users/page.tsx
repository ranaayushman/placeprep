import { SubmitButton } from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { listUsers, type UserFilter } from "@/lib/admin";
import { ago, fmtDate, isOnline } from "@/components/admin/when";

export const dynamic = "force-dynamic";

const FILTERS: { id: UserFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active 24 h" },
  { id: "flagged", label: "Flagged" },
  { id: "blocked", label: "Blocked" },
  { id: "admins", label: "Admins & mods" },
];

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string; msg?: string }> }) {
  await requireAdmin(); // the layout also lets moderators in
  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.id === sp.filter)?.id ?? "all") as UserFilter;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").slice(0, 100);
  const { rows, total, pages } = await listUsers({ q, filter, page });
  const href = (p: Partial<{ q: string; filter: string; page: number }>) => {
    const u = new URLSearchParams({ q, filter, page: String(page), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) });
    return `/admin/users?${u}`;
  };

  return (
    <div className="space-y-5">
      {sp.msg && <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-900">{sp.msg}</div>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-slate-500">{total} matching</p>
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="filter" value={filter} />
          <input name="q" defaultValue={q} placeholder="Search name or email" className="input w-64" />
          <SubmitButton className="btn-secondary">Search</SubmitButton>
        </form>
      </div>

      <div className="flex gap-1 text-sm">
        {FILTERS.map((f) => (
          <Link key={f.id} href={href({ filter: f.id, page: 1 })} className={`rounded-md px-3 py-1.5 ${filter === f.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3">Student</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Last seen</th>
              <th className="px-4 py-3 text-right">Answered</th><th className="px-4 py-3 text-right">Mocks</th><th className="px-4 py-3 text-right">Avg mock</th>
              <th className="px-4 py-3 text-right">Warnings</th><th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-indigo-600 hover:underline">{u.name}</Link>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-2.5">
                  {isOnline(u.lastSeenAt) ? <span className="font-medium text-emerald-600">● online</span> : <span className="text-slate-500">{ago(u.lastSeenAt)}</span>}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{u.answered}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{u.mocks}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{u.avg_mock == null ? "—" : `${Math.round(u.avg_mock * 100)}%`}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${u.violations >= 3 ? "font-semibold text-red-600" : ""}`}>{u.violations}</td>
                <td className="px-4 py-2.5">
                  {u.blocked ? <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Blocked</span>
                    : u.role !== "STUDENT" ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{u.role === "ADMIN" ? "Admin" : "Moderator"}</span>
                    : <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Student</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No users match.</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href({ page: page - 1 })} className="btn-secondary">← Previous</Link> : <span />}
          <span className="text-slate-500">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ page: page + 1 })} className="btn-secondary">Next →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
