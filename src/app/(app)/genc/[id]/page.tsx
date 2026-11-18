import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { closeLeftAttempts } from "@/lib/exam/service";
import { GENC_DIFFICULTIES, GENC_VARIANTS, getRun, type RunPaper } from "@/lib/exam/runs";
import { ProgressBar, pct } from "@/components/charts";
import { fmtDate } from "@/components/admin/when";

export const metadata = { title: "Your GenC drive" };

const ratio = (score: number | null | undefined, max: number | null | undefined) => (max ? (score ?? 0) / max : null);

function PaperCard({ runId, p, n }: { runId: string; p: RunPaper; n: number }) {
  const mcq = p.exam.pattern.filter((s) => s.section !== "writing");
  const q = mcq.reduce((a, s) => a + s.questions, 0);
  const min = mcq.reduce((a, s) => a + s.minutes, 0);
  const a = p.attempt;
  return (
    <article className={`card flex flex-col ${a?.status === "SUBMITTED" ? "border-brand/40" : ""}`}>
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">Paper {n}</p>
      <h3 className="mt-1 text-lg font-bold">{p.def.title}</h3>
      <p className="mt-1 text-sm text-muted">{p.def.blurb}</p>
      <p className="mt-2 text-sm text-muted">{q} questions · {min} min{p.exam.pattern.some((s) => s.section === "writing") ? " · optional essay" : ""}</p>

      <div className="mt-auto pt-4">
        {a?.status === "SUBMITTED" ? (
          <>
            <p className="text-3xl font-bold tabular-nums">{a.score}<span className="text-lg text-muted">/{a.maxScore}</span></p>
            <p className="text-sm text-muted">{pct(ratio(a.score, a.maxScore))}{a.submittedAt ? ` · taken ${fmtDate(a.submittedAt)}` : ""}{a.autoSubmitted ? " · auto-submitted" : ""}</p>
            <Link href={`/results/${a.id}`} className="btn-secondary mt-3">Review answers →</Link>
          </>
        ) : a ? (
          <>
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">In progress. The timer keeps running while you&apos;re away.</p>
            <Link href={`/attempt/${a.id}`} className="btn-primary">Resume →</Link>
          </>
        ) : (
          <Link href={`/mock?exam=${p.def.examId}&run=${runId}`} className="btn-primary">Start this paper →</Link>
        )}
      </div>
    </article>
  );
}

export default async function GencRunPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  await closeLeftAttempts(user.id); // a paper they walked away from is scored first
  const run = await getRun(user.id, id);
  if (!run) notFound();
  const left = run.papers.length - run.done;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/genc/suite/${run.variant}`} className="text-sm text-muted hover:text-deep">← GenC {run.variant === "java" ? "Java" : "Python"} cluster</Link>
        <h1 className="mt-2 flex flex-wrap items-center gap-3 text-2xl font-bold sm:text-3xl">
          Cognizant GenC · {GENC_VARIANTS[run.variant].label}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${run.difficulty === "extreme" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>{GENC_DIFFICULTIES[run.difficulty].label}</span>
        </h1>
        <p className="text-muted">Started {fmtDate(run.createdAt)}. Take the papers in any order and at any time.</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</p>}

      {run.combined ? (
        <section className="rounded-2xl bg-deep p-6 text-white">
          <p className="text-xs font-semibold tracking-wider text-sun uppercase">Combined score · all 3 papers</p>
          <p className="mt-2 text-5xl font-bold tabular-nums">{run.combined.score}<span className="text-2xl text-white/60">/{run.combined.maxScore}</span></p>
          <p className="mt-1 text-white/70">{pct(ratio(run.combined.score, run.combined.maxScore))} correct overall</p>
          <ul className="mt-5 space-y-3">
            {run.papers.map((p) => {
              const r = ratio(p.attempt?.score, p.attempt?.maxScore);
              return (
                <li key={p.def.slug}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{p.def.title}</span>
                    <span className="tabular-nums text-white/80">{p.attempt?.score}/{p.attempt?.maxScore} · {pct(r)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/15" role="img" aria-label={`${p.def.title} ${pct(r)}`}>
                    <div className="h-full rounded-full bg-sun" style={{ width: `${Math.round((r ?? 0) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="card">
          <h2 className="font-semibold">{run.done} of {run.papers.length} papers done</h2>
          <div className="mt-3"><ProgressBar value={run.done / run.papers.length} label="Papers completed" /></div>
          <p className="mt-3 text-sm text-muted">
            Your combined score appears once all three papers are submitted. {left === 1 ? "One paper to go." : `${left} papers to go.`} Each paper&apos;s own score shows as soon as you finish it.
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {run.papers.map((p, i) => <PaperCard key={p.def.slug} runId={run.id} p={p} n={i + 1} />)}
      </div>

      {run.complete && (
        <p className="text-sm text-muted">
          Want another go? <Link href={`/genc/suite/${run.variant}`} className="font-medium text-brand underline underline-offset-2">Start a new drive</Link> for fresh questions in all three papers.
        </p>
      )}
    </div>
  );
}
