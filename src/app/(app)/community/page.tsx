import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { mySubmissions } from "@/lib/community/service";
import { SECTION_LABELS, TOPIC_BY_ID, type SectionId } from "@/lib/questions";

export const metadata: Metadata = { title: "Community questions" };

const STATUS: Record<string, { label: string; tone: string }> = {
  PENDING_REVIEW: { label: "In review", tone: "bg-slate-100 text-slate-700" },
  FLAGGED_DUPLICATE: { label: "In review · similar question found", tone: "bg-amber-100 text-amber-800" },
  PUBLISHED: { label: "Published", tone: "bg-emerald-100 text-emerald-700" },
  NEEDS_REVIEW: { label: "Being re-checked after reports", tone: "bg-amber-100 text-amber-800" },
  REJECTED: { label: "Not added", tone: "bg-red-100 text-red-700" },
};

const NOTICE: Record<string, string> = {
  PENDING_REVIEW: "Thanks! Your question is in the review queue.",
  FLAGGED_DUPLICATE: "Thanks! It looks similar to a question we already have, so an admin will compare the two before deciding.",
};

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const user = await requireUser();
  const { submitted } = await searchParams;
  const mine = await mySubmissions(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Community questions</h1>
          <p className="mt-1 text-slate-500">Questions you&apos;ve shared, and what happened to them.</p>
        </div>
        <Link href="/community/submit" className="btn-primary">Submit a question</Link>
      </div>

      {submitted && NOTICE[submitted] && <p role="status" className="rounded-lg bg-brand-soft px-4 py-2 text-sm text-brand-dark">{NOTICE[submitted]}</p>}

      {mine.length === 0 ? (
        <div className="card text-sm text-slate-500">You haven&apos;t submitted any questions yet.</div>
      ) : (
        <ul className="space-y-3">
          {mine.map((q) => (
            <li key={q.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="whitespace-pre-line text-sm font-medium">{q.stem}</p>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${STATUS[q.status].tone}`}>{STATUS[q.status].label}</span>
              </div>
              <p className="text-xs text-slate-500">
                {SECTION_LABELS[q.section as SectionId]} · {TOPIC_BY_ID.get(q.topic)?.label ?? q.topic} · {q.company}
                {q.year ? ` ${q.year}` : ""} · {q.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
              {q.status === "REJECTED" && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  {q.duplicateOfRef ? "Duplicate: " : "Reason: "}
                  {q.rejectionReason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
