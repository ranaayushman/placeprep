import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { activityFeed, describeEvent, EVENT_TYPES } from "@/lib/admin";
import { fmtDateTime } from "@/components/admin/when";

export const dynamic = "force-dynamic";

export default async function Activity({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }) {
  await requireAdmin(); // the layout also lets moderators in
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const rows = await activityFeed({ type: sp.type, page });
  const link = (type?: string, p = 1) => `/admin/activity?${new URLSearchParams({ ...(type ? { type } : {}), page: String(p) })}`;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Activity</h1>
      <div className="flex flex-wrap gap-1 text-sm">
        <Link href={link()} className={`rounded-md px-3 py-1.5 ${!sp.type ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>All</Link>
        {EVENT_TYPES.map((t) => (
          <Link key={t} href={link(t)} className={`rounded-md px-3 py-1.5 ${sp.type === t ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>{t.replace("_", " ")}</Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">IP</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap px-4 py-2 text-slate-500">{fmtDateTime(r.createdAt)}</td>
                <td className="px-4 py-2">{r.user_id ? <Link href={`/admin/users/${r.user_id}`} className="text-indigo-600 hover:underline">{r.name}</Link> : <span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-2">{describeEvent(r.type, r.meta)}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-400">{r.ip ?? ""}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No events.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between text-sm">
        {page > 1 ? <Link href={link(sp.type, page - 1)} className="btn-secondary">← Newer</Link> : <span />}
        {rows.length === 50 && <Link href={link(sp.type, page + 1)} className="btn-secondary">Older →</Link>}
      </div>
    </div>
  );
}
