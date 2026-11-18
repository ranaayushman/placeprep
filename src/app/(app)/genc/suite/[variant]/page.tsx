import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { LockIcon } from "@/components/LockIcon";
import { requireUser } from "@/lib/auth";
import { getExam } from "@/lib/exam/exams";
import { closeLeftAttempts } from "@/lib/exam/service";
import { EXTREME_LOCK_KEY, GENC_DIFFICULTIES, GENC_VARIANTS, isGencVariant, listRuns } from "@/lib/exam/runs";
import { inviteLink, referralLock } from "@/lib/referral";
import { SECTION_LABELS } from "@/lib/questions";
import { MAX_VIOLATIONS } from "@/lib/exam/pattern";
import { fmtDate } from "@/components/admin/when";
import { InviteCard } from "../../../mock/InviteCard";
import { startGenc } from "../../actions";

export async function generateMetadata({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  return { title: isGencVariant(variant) ? `Cognizant GenC · ${GENC_VARIANTS[variant].label}` : "Cognizant GenC" };
}

export default async function GencSuitePage({ params, searchParams }: { params: Promise<{ variant: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const [{ variant }, { error }] = await Promise.all([params, searchParams]);
  if (!isGencVariant(variant)) notFound();
  await closeLeftAttempts(user.id);
  const v = GENC_VARIANTS[variant];
  const [exams, lock, runs] = await Promise.all([
    Promise.all(v.papers.map((p) => getExam(p.examId))),
    referralLock(user.id, EXTREME_LOCK_KEY), // null = Extreme is open to this student
    listRuns(user.id),
  ]);
  const link = lock ? await inviteLink(user.id) : null;
  const mine = runs.filter((r) => r.variant === variant);
  const cluster = variant === "java" ? "Java" : "Python";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/genc" className="text-sm text-muted hover:text-deep">← Cognizant GenC</Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Cognizant GenC · {cluster} cluster</h1>
        <p className="mt-2 text-muted">
          The full GenC assessment for the {v.label} cluster, split into three papers you take on your own schedule. Read what each paper covers,
          pick a difficulty, then sit the papers whenever suits you: one this evening, one tomorrow morning, one tomorrow night. Your combined score
          and each paper&apos;s score appear as you go.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</p>}

      <section>
        <h2 className="text-xl font-bold">The three papers</h2>
        <ol className="mt-3 space-y-3">
          {v.papers.map((p, i) => {
            const exam = exams[i];
            const mcq = exam?.pattern.filter((s) => s.section !== "writing") ?? [];
            return (
              <li key={p.slug} className="card">
                <p className="text-xs font-semibold tracking-wider text-muted uppercase">Paper {i + 1}</p>
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted">{p.blurb}</p>
                <p className="mt-2 text-sm font-medium tabular-nums">
                  {mcq.reduce((a, s) => a + s.questions, 0)} questions · {mcq.reduce((a, s) => a + s.minutes, 0)} min
                  {exam?.pattern.some((s) => s.section === "writing") && <span className="font-normal text-muted"> · plus an optional 20 min essay</span>}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                  {exam?.pattern.map((s) => (
                    <li key={s.section} className="rounded-full bg-canvas-deep px-2.5 py-1 text-muted">
                      {SECTION_LABELS[s.section]} · {s.section === "writing" ? "1 essay" : `${s.questions} Q`} · {s.minutes} min
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="card text-sm text-muted">
        <h2 className="text-base font-semibold text-deep">How it works</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Each paper has its own timer. Once you start a paper the clock runs, so pick a time you can finish it.</li>
          <li>Papers run full screen on a laptop or desktop. Leaving full screen or switching tabs counts as a warning; at {MAX_VIOLATIONS} the paper is submitted.</li>
          <li>No negative marking, and you can&apos;t go back to a section after submitting it.</li>
          <li>Your combined score is your total marks across all three papers, shown once the third is submitted.</li>
        </ul>
      </section>

      <form action={startGenc} className="card space-y-4">
        <input type="hidden" name="variant" value={variant} />
        <h2 className="text-xl font-bold">Choose your difficulty</h2>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Difficulty</legend>
          {(Object.keys(GENC_DIFFICULTIES) as (keyof typeof GENC_DIFFICULTIES)[]).map((key) => {
            const d = GENC_DIFFICULTIES[key];
            const locked = key === "extreme" && !!lock;
            return (
              <label key={key} className={`flex items-start gap-3 rounded-xl border p-4 ${locked ? "cursor-not-allowed border-deep/10 bg-canvas-deep opacity-80" : "cursor-pointer border-deep/15 has-[:checked]:border-brand has-[:checked]:bg-brand-soft"}`}>
                <input type="radio" name="difficulty" value={key} defaultChecked={key === "standard"} disabled={locked} className="mt-1 h-4 w-4" />
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    {d.label}
                    {locked && <span className="inline-flex items-center gap-1 rounded-full bg-deep/10 px-2 py-0.5 text-xs font-medium text-deep"><LockIcon size={12} />Locked</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{d.blurb}</span>
                  {locked && <span className="mt-1 block text-sm font-medium text-deep">Invite {lock.need} friends to unlock ({lock.have} of {lock.need} joined).</span>}
                </span>
              </label>
            );
          })}
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton className="btn-primary px-6 py-3">Start the drive →</SubmitButton>
          <span className="text-sm text-muted">Papers need a laptop or desktop.</span>
        </div>
      </form>

      {lock && link && <InviteCard link={link} have={lock.have} need={lock.need} />}

      {mine.length > 0 && (
        <section>
          <h2 className="text-xl font-bold">Your {cluster} drives</h2>
          <ul className="mt-3 space-y-3">
            {mine.map((r) => (
              <li key={r.id}>
                <Link href={`/genc/${r.id}`} className="card flex flex-wrap items-center justify-between gap-3 transition hover:border-brand/50">
                  <span>
                    <span className="block font-semibold">{GENC_DIFFICULTIES[r.difficulty].label} drive</span>
                    <span className="block text-sm text-muted">Started {fmtDate(r.createdAt)} · {r.done} of {r.papers.length} papers done</span>
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.complete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {r.complete ? `Done · ${r.combined!.score}/${r.combined!.maxScore}` : "Continue"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
