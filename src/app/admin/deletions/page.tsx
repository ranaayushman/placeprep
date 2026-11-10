import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { deletionDue, DELETION_DUE_DAYS, pendingDeletions } from "@/lib/deletion-requests";
import { fmtDate } from "@/components/admin/when";

export const dynamic = "force-dynamic";

export default async function DeletionRequestsPage() {
  await requireAdmin();
  const rows = await pendingDeletions();
  const now = Date.now();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Deletion requests</h1>
        <p className="text-sm text-slate-500">
          Students who asked for their account to be deleted. The Privacy Policy promises it within {DELETION_DUE_DAYS} days. Open the student and use <b>Delete account</b>; the request disappears once they&apos;re deleted.
          Requests that arrive by email: delete the account directly.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="card text-sm text-slate-500">No open requests.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const due = deletionDue(r.createdAt);
            const daysLeft = Math.ceil((due.getTime() - now) / 86_400_000);
            return (
              <li key={r.userId} className="card flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <Link href={`/admin/users/${r.userId}`} className="font-semibold hover:underline">{r.name}</Link> <span className="text-slate-500">· {r.email}</span>
                  {r.role !== "STUDENT" && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{r.role} — remove the role first</span>}
                  <p className="text-xs text-slate-500">Requested {fmtDate(r.createdAt)}{r.reason ? ` · “${r.reason}”` : ""}</p>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-semibold ${daysLeft < 0 ? "bg-red-100 text-red-800" : daysLeft <= 7 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                  {daysLeft < 0 ? `Overdue by ${-daysLeft} day${daysLeft === -1 ? "" : "s"}` : `Due ${fmtDate(due)} · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
