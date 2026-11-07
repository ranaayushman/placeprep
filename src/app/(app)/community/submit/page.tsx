import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { COMMUNITY_SECTIONS, COMPANIES, MAX_SUBMISSIONS_PER_DAY, MIN_ANSWERED_TO_UPLOAD } from "@/lib/community/config";
import { uploadEligibility } from "@/lib/community/service";
import { SECTION_LABELS, topicsFor } from "@/lib/questions";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = { title: "Submit a question" };

export default async function SubmitPage() {
  const user = await requireUser();
  const elig = await uploadEligibility(user.id);
  const sections = COMMUNITY_SECTIONS.map((s) => ({ id: s, label: SECTION_LABELS[s], topics: topicsFor(s).map((t) => ({ id: t.id, label: t.label })) }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/community" className="text-sm text-slate-500 hover:text-slate-900">← My submissions</Link>
        <h1 className="mt-2 text-2xl font-bold">Submit a question</h1>
        <p className="mt-1 text-slate-500">
          Wrote a good question in the style of placement tests? Every question is checked against the ones we already have and
          reviewed by an admin before other students see it.
        </p>
      </div>

      <aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Before you submit</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Write it in your own words. Don&apos;t copy from prep websites, books or paid courses.</li>
          <li>Don&apos;t submit questions from a real test you took. Companies often require candidates to keep them confidential.</li>
          <li>We remove reported or copied content quickly.</li>
        </ul>
      </aside>

      {elig.needMore > 0 ? (
        <div className="card text-sm">
          <p className="font-semibold">Almost there</p>
          <p className="mt-1 text-slate-600">
            You can submit questions after answering {MIN_ANSWERED_TO_UPLOAD} practice questions. You&apos;ve answered {elig.answered}, so{" "}
            {elig.needMore} to go.
          </p>
          <Link href="/practice" className="btn-primary mt-3">Practise now</Link>
        </div>
      ) : !elig.ok ? (
        <div className="card text-sm">You&apos;ve submitted {MAX_SUBMISSIONS_PER_DAY} questions in the last 24 hours. Please come back tomorrow.</div>
      ) : (
        <SubmitForm sections={sections} companies={COMPANIES} />
      )}
    </div>
  );
}
