import { desc } from "drizzle-orm";
import { announcements, db } from "@/db";
import { fmtDateTime } from "@/components/admin/when";
import { deleteAnnouncement, postAnnouncement } from "../actions";

export const dynamic = "force-dynamic";

export default async function Announcements({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(50);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Product updates</h1>
        <p className="text-sm text-slate-500">Shown to every student under the bell in the navbar (latest 10). New ones get an unread dot.</p>
      </div>
      {msg && <div role="status" className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-900">{msg}</div>}

      <form action={postAnnouncement} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm">
          <span className="font-medium">Title</span>
          <input name="title" required minLength={3} maxLength={100} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="New: Cryptarithmetic practice" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Details</span>
          <textarea name="body" required minLength={3} maxLength={1000} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <button className="btn-primary">Post update</button>
      </form>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {rows.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="whitespace-pre-line text-sm text-slate-600">{a.body}</p>
              <p className="mt-1 text-xs text-slate-400">{fmtDateTime(a.createdAt)}</p>
            </div>
            <form action={deleteAnnouncement}>
              <input type="hidden" name="id" value={a.id} />
              <button className="btn-secondary">Delete</button>
            </form>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No updates posted yet.</li>}
      </ul>
    </div>
  );
}
