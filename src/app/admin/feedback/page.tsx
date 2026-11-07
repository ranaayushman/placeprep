import Link from "next/link";
import { latestFeedback } from "@/lib/feedback";
import { fmtDateTime } from "@/components/admin/when";

export const dynamic = "force-dynamic";

const PARTS = [
  ["product", "PlacePrep"],
  ["questions", "Questions"],
  ["suggestions", "Suggestions"],
] as const;

export default async function AdminFeedback() {
  const rows = await latestFeedback();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-sm text-slate-500">What students wrote after finishing a test. Newest first, last 100.</p>
      </div>
      {rows.length === 0 ? (
        <p className="card text-sm text-slate-500">No feedback yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ f, name, email, title, score, maxScore }) => (
            <li key={f.id} className="card text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-slate-500">
                <span>
                  <Link href={`/admin/users/${f.userId}`} className="font-medium text-slate-800 hover:underline">{name}</Link> · {email} · {title} ({score}/{maxScore})
                </span>
                <span>{fmtDateTime(f.createdAt)}</span>
              </div>
              <dl className="mt-2 space-y-2">
                {PARTS.filter(([k]) => f[k]).map(([k, label]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                    <dd className="whitespace-pre-wrap text-slate-800">{f[k]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
