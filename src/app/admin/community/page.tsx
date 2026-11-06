import Link from "next/link";
import { queue, statusCounts, suspiciousAnswerKeys } from "@/lib/community/service";
import { SECTION_LABELS, TOPIC_BY_ID, type SectionId } from "@/lib/questions";
import { ago } from "@/components/admin/when";
import { communityQuestions, db } from "@/db";
import { inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "flagged", status: "FLAGGED_DUPLICATE", label: "Flagged duplicates" },
  { id: "pending", status: "PENDING_REVIEW", label: "Pending review" },
  { id: "reported", status: "NEEDS_REVIEW", label: "Reported" },
  { id: "published", status: "PUBLISHED", label: "Published" },
  { id: "rejected", status: "REJECTED", label: "Rejected" },
] as const;

export default async function CommunityQueue({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const wanted = (await searchParams).tab;
  const tab = TABS.find((t) => t.id === wanted) ?? TABS[0];
  const [counts, rows, suspicious] = await Promise.all([statusCounts(), queue(tab.status), suspiciousAnswerKeys()]);
  // "Reported" also lists published questions whose answer statistics look wrong.
  const keyRows =
    tab.id === "reported" && suspicious.length
      ? await db.select().from(communityQuestions).where(inArray(communityQuestions.id, suspicious.map((s) => s.id)))
      : [];
  const statsById = new Map(suspicious.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community questions</h1>
        <p className="text-sm text-slate-500">Every submission is reviewed before students see it. Flagged ones are ≥ 50% similar to an existing question.</p>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/community?tab=${t.id}`}
            aria-current={t.id === tab.id ? "page" : undefined}
            className={`rounded-lg border px-3 py-1.5 font-medium ${t.id === tab.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"}`}
          >
            {t.label} <span className="tabular-nums opacity-70">{(counts[t.status] ?? 0) + (t.id === "reported" ? suspicious.length : 0)}</span>
          </Link>
        ))}
      </nav>

      {keyRows.length > 0 && (
        <section className="card border-amber-300 bg-amber-50">
          <h2 className="font-semibold text-amber-900">Answer key may be wrong</h2>
          <ul className="mt-2 divide-y divide-amber-200 text-sm">
            {keyRows.map((q) => {
              const s = statsById.get(q.id)!;
              return (
                <li key={q.id} className="flex items-center justify-between gap-4 py-2">
                  <span className="truncate">{q.stem}</span>
                  <span className="shrink-0 tabular-nums text-amber-900">
                    {s.answers} answers · {Math.round(s.accuracy * 100)}% correct
                    {s.topWrongShare != null ? ` · ${Math.round(s.topWrongShare * 100)}% chose ${"ABCD"[s.top_wrong!]}` : ""}
                  </span>
                  <Link href={`/admin/community/${q.id}`} className="shrink-0 font-semibold text-amber-900 hover:underline">Review →</Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {rows.length === 0 ? (
        <p className="card text-sm text-slate-500">Nothing here.</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr><th className="px-4 py-2">Question</th><th className="px-4 py-2">Topic</th><th className="px-4 py-2">By</th><th className="px-4 py-2">Best match</th><th className="px-4 py-2">Submitted</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ q, author }) => (
                <tr key={q.id}>
                  <td className="max-w-md truncate px-4 py-2">{q.stem}</td>
                  <td className="px-4 py-2 text-slate-500">{SECTION_LABELS[q.section as SectionId]} · {TOPIC_BY_ID.get(q.topic)?.label}</td>
                  <td className="px-4 py-2">{author}</td>
                  <td className={`px-4 py-2 tabular-nums ${q.bestMatchScore >= 0.85 ? "font-semibold text-red-600" : q.bestMatchScore >= 0.5 ? "text-amber-600" : "text-slate-500"}`}>{Math.round(q.bestMatchScore * 100)}%</td>
                  <td className="px-4 py-2 text-slate-500">{ago(q.createdAt)}</td>
                  <td className="px-4 py-2 text-right"><Link href={`/admin/community/${q.id}`} className="font-semibold text-slate-900 hover:underline">Review →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
