import Link from "next/link";
import { hasCodeAccess, requireGooglePath } from "@/lib/auth";
import { GOOGLE_ATTRIBUTES, GOOGLE_PATH, GOOGLE_PROCESS, PATH_PROBLEM_COUNT, type Confidence } from "@/lib/google-path";
import { PathChecklist } from "./PathChecklist";

export const metadata = { title: "Google SDE path", robots: { index: false, follow: false } };

const CONFIDENCE_TONE: Record<Confidence, string> = {
  official: "bg-emerald-100 text-emerald-800",
  "widely reported": "bg-sky-100 text-sky-800",
  "candidate reports": "bg-amber-100 text-amber-800",
};

export default async function GooglePathPage() {
  const user = await requireGooglePath();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google SDE path · University Graduate (L3)</h1>
        <p className="mt-1 text-slate-500">
          16 weeks, about 3 hours a day: {PATH_PROBLEM_COUNT} problems in dependency order, then interview practice. Topics follow what Google interview reports keep mentioning: arrays and strings, trees and graphs, and dynamic programming.
        </p>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Phases">
          {GOOGLE_PATH.map((ph, i) => (
            <a key={ph.id} href={`#${ph.id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:border-brand">
              {i + 1}. {ph.title}
            </a>
          ))}
        </nav>
      </div>

      <section className="card">
        <h2 className="font-semibold">How Google hires new-grad engineers</h2>
        <ol className="mt-3 space-y-3">
          {GOOGLE_PROCESS.map((s, i) => (
            <li key={s.step} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark">{i + 1}</span>
              <div>
                <p className="font-semibold">
                  {s.step} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${CONFIDENCE_TONE[s.confidence]}`}>{s.confidence}</span>
                </p>
                <p className="text-slate-600">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-500">Google does not publish the exact new-grad format, and it changes. Confirm the round count with your recruiter once you get the call.</p>
      </section>

      <section className="card">
        <h2 className="font-semibold">What every interviewer scores</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {GOOGLE_ATTRIBUTES.map((a) => (
            <div key={a.name} className="rounded-lg border border-slate-200 p-3 text-sm">
              <dt className="font-semibold">{a.name}</dt>
              <dd className="mt-1 text-slate-600">{a.what}</dd>
            </div>
          ))}
        </dl>
      </section>

      {hasCodeAccess(user) && (
        <p className="text-sm text-slate-600">
          Warm up on the <Link href="/dsa" className="font-medium text-brand-dark underline">PlacePrep DSA track</Link> (judged on hidden tests) before the LeetCode problems below.
        </p>
      )}

      <PathChecklist phases={GOOGLE_PATH} total={PATH_PROBLEM_COUNT} />
    </div>
  );
}
