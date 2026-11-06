import Link from "next/link";
import { blockedList } from "@/lib/admin";
import { fmtDateTime } from "@/components/admin/when";
import { unblockUser } from "../actions";

export const dynamic = "force-dynamic";

export default async function BlockList() {
  const rows = await blockedList();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Block list</h1>
        <p className="text-sm text-slate-500">
          Blocked accounts can&apos;t log in, and they were signed out of every device when blocked. To block someone, open their profile in{" "}
          <Link href="/admin/users" className="text-indigo-600 hover:underline">Users</Link>.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Blocked</th><th className="px-4 py-3">By</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/users/${r.id}`} className="font-medium text-indigo-600 hover:underline">{r.name}</Link>
                  <div className="text-xs text-slate-400">{r.email}</div>
                </td>
                <td className="px-4 py-2.5 text-slate-700">{r.blocked_reason ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-500">{fmtDateTime(r.blockedAt)}</td>
                <td className="px-4 py-2.5 text-slate-500">{r.blocked_by_name ?? "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <form action={unblockUser}>
                    <input type="hidden" name="userId" value={r.id} />
                    <input type="hidden" name="from" value="blocked" />
                    <button className="btn-secondary">Unblock</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No one is blocked.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
