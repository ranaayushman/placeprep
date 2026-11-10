import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { errorGroups } from "@/lib/app-errors";
import { ago } from "@/components/admin/when";

export const dynamic = "force-dynamic";

export default async function ErrorsPage() {
  await requireAdmin();
  const groups = await errorGroups();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Errors</h1>
        <p className="text-sm text-slate-500">
          Crashes from the last 7 days. <b>Browser</b> errors come from students&apos; screens; <b>server</b> errors from pages and actions. The same error is grouped. Kept for 30 days.
          The error code students see matches the code here and in Vercel&apos;s logs.
        </p>
      </div>
      {groups.length === 0 ? (
        <p className="card text-sm text-slate-500">No errors in the last 7 days.</p>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => (
            <li key={`${g.source}:${g.message}`} className="card space-y-2 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-mono text-sm break-all text-slate-900">{g.message}</p>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${g.source === "server" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                  {g.source === "server" ? "Server" : "Browser"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                <b className="text-slate-800">{g.count}×</b> · {g.users} signed-in student{g.users === 1 ? "" : "s"} · last {ago(g.lastAt)} · first {ago(g.firstAt)}
                {g.path && <> · on <Link href={g.path} className="font-mono hover:underline">{g.path}</Link></>}
                {g.digest && <> · code <span className="font-mono">{g.digest}</span></>}
              </p>
              {(g.stack || g.userAgent) && (
                <details>
                  <summary className="cursor-pointer text-xs font-medium text-slate-500">Details</summary>
                  {g.userAgent && <p className="mt-2 text-xs text-slate-500">{g.userAgent}</p>}
                  {g.stack && <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-50 p-3 text-xs">{g.stack}</pre>}
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
