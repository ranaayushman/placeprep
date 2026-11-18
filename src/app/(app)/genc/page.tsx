import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { closeLeftAttempts } from "@/lib/exam/service";
import { GENC_DIFFICULTIES, GENC_VARIANTS, listRuns } from "@/lib/exam/runs";
import { pct } from "@/components/charts";
import { fmtDate } from "@/components/admin/when";

export const metadata = { title: "Cognizant GenC · 3 papers" };

export default async function GencPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  await closeLeftAttempts(user.id); // a paper they walked away from counts as finished
  const [runs, { error }] = await Promise.all([listRuns(user.id), searchParams]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Cognizant GenC · 3 papers</h1>
        <p className="mt-2 text-muted">
          Take <b className="text-deep">Communication</b>, <b className="text-deep">Aptitude</b> and <b className="text-deep">Coding</b> as separate papers,
          whenever suits you. When all three are done, you get your combined score along with each paper&apos;s own score. Pick your cluster to see what&apos;s in it.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(GENC_VARIANTS) as (keyof typeof GENC_VARIANTS)[]).map((key) => (
          <Link key={key} href={`/genc/suite/${key}`} className="card block transition hover:border-brand/50">
            <p className="text-xs font-semibold tracking-wider text-muted uppercase">Cognizant GenC</p>
            <h2 className="mt-1 text-xl font-bold">{key === "java" ? "Java" : "Python"} cluster</h2>
            <p className="mt-1 text-sm text-muted">{GENC_VARIANTS[key].label} · 3 papers</p>
            <span className="btn-primary mt-4">View the suite →</span>
          </Link>
        ))}
      </div>

      {runs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold">Your drives</h2>
          <ul className="mt-3 space-y-3">
            {runs.map((r) => (
              <li key={r.id}>
                <Link href={`/genc/${r.id}`} className="card flex flex-wrap items-center justify-between gap-3 transition hover:border-brand/50">
                  <span>
                    <span className="block font-semibold">GenC · {r.variant === "java" ? "Java" : "Python"} · {GENC_DIFFICULTIES[r.difficulty].label}</span>
                    <span className="block text-sm text-muted">Started {fmtDate(r.createdAt)} · {r.done} of {r.papers.length} papers done</span>
                  </span>
                  {r.combined ? (
                    <span className="text-right">
                      <span className="block text-xl font-bold tabular-nums">{r.combined.score}<span className="text-sm text-muted">/{r.combined.maxScore}</span></span>
                      <span className="block text-xs text-muted">{pct(r.combined.maxScore ? r.combined.score / r.combined.maxScore : null)} combined</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">In progress</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
