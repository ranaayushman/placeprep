import { SubmitButton } from "@/components/SubmitButton";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { attempts, db, users } from "@/db";
import { hasCodeAccess, requireUser } from "@/lib/auth";
import { getTopicStats, mockHistory, recommend, sectionStats, type TopicStat } from "@/lib/analytics";
import { closeLeftAttempts, wrongRefs } from "@/lib/exam/service";
import { MAX_VIOLATIONS } from "@/lib/exam/pattern";
import { featuredExamIds, listExamsFor, type Exam } from "@/lib/exam/exams";
import { ExamCarousel } from "@/components/ExamCarousel";
import { AdSlot } from "@/components/AdSlot";
import { ProgressBar, pct } from "@/components/charts";
import { SECTION_LABELS } from "@/lib/questions";
import { LevelBadge } from "@/components/LevelBadge";
import { retryMistakes, startPractice } from "../start-actions";

/** Recruiters students ask for most that have no mock yet (see EXAMS in lib/exam/pattern.ts). */
const UPCOMING_COMPANIES = ["TCS", "Wipro", "Accenture", "Capgemini"]; // Cognizant has its own card below

// Fail fast instead of hanging for the 300s platform default if the DB stalls.
export const maxDuration = 30;

const QUIZ_BTN =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-brand-dark px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-deep";

/** One-tap practice set: a tiny form posting the topics to the existing startPractice action. */
function QuizButton({ topics, count = 10, timed = false, children, className = QUIZ_BTN }: { topics: string[]; count?: number; timed?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <form action={startPractice}>
      {topics.map((t) => <input key={t} type="hidden" name="topic" value={t} />)}
      <input type="hidden" name="count" value={count} />
      {timed && <input type="hidden" name="timed" value="on" />}
      <SubmitButton className={className}>{children}</SubmitButton>
    </form>
  );
}

const topicTone = (t: TopicStat) =>
  t.attempted === 0
    ? { dot: "bg-deep/20", note: "new" }
    : t.mastery < 0.6
      ? { dot: "bg-amber-500", note: `${pct(t.accuracy)} · needs work` }
      : { dot: "bg-success", note: `${pct(t.accuracy)} · strong` };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  await closeLeftAttempts(user.id); // a test they walked away from shows as finished, not "in progress"
  const [EXAMS, featuredIds] = await Promise.all([listExamsFor(user.email), featuredExamIds()]);
  const hasCognizant = EXAMS.some((e) => e.company.toLowerCase() === "cognizant");
  const { error } = await searchParams;
  const [stats, history, wrong, recent, [profile]] = await Promise.all([
    getTopicStats(user.id),
    mockHistory(user.id),
    wrongRefs(user.id, 50),
    db.select().from(attempts).where(eq(attempts.userId, user.id)).orderBy(desc(attempts.startedAt)).limit(6),
    db.select({ dreamCompany: users.dreamCompany, passoutYear: users.passoutYear }).from(users).where(eq(users.id, user.id)),
  ]);
  const sections = sectionStats(stats);
  const recs = recommend(stats, history, wrong.length).slice(0, 3);
  const inProgress = recent.filter((a) => a.status === "IN_PROGRESS");
  const answered = stats.reduce((a, t) => a + t.attempted, 0);
  const correct = stats.reduce((a, t) => a + t.correct, 0);
  const best = history.reduce((m, h) => Math.max(m, h.maxScore ? h.score / h.maxScore : 0), 0);

  const dream = profile?.dreamCompany?.trim();
  const dreamIsAvailable = !!dream && EXAMS.some((e) => dream.toLowerCase().includes(e.company.toLowerCase()));
  // Put the student's dream company first among the upcoming ones.
  const upcoming = dream && !dreamIsAvailable ? [dream, ...UPCOMING_COMPANIES.filter((c) => c.toLowerCase() !== dream.toLowerCase())].slice(0, 5) : UPCOMING_COMPANIES;
  const isDreamExam = (company: string) => !!dream && dream.toLowerCase().includes(company.toLowerCase());
  const sortedExams = [...EXAMS].sort((a, b) => Number(isDreamExam(b.company)) - Number(isDreamExam(a.company)));
  // Admin-chosen carousel (only exams this student can see), then everything else in the grid.
  const featured = featuredIds.map((id) => EXAMS.find((e) => e.id === id)).filter((e): e is Exam => !!e);
  const gridExams = sortedExams.filter((e) => !featured.includes(e));
  const examStats = (exam: Exam) => {
    // Mocks from before exams were tracked have exam = null; they were all Infosys.
    const mine = history.filter((h) => (h.exam ?? "infosys-se") === exam.id);
    return { taken: mine.length, best: mine.reduce((m, h) => Math.max(m, h.maxScore ? h.score / h.maxScore : 0), 0) };
  };
  const weakest = stats.filter((t) => t.attempted > 0).sort((a, b) => a.mastery - b.mastery).slice(0, 3);

  return (
    <div className="space-y-10 text-deep">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hi {user.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-muted">
            {dream ? <>Aiming for <b className="text-deep">{dream}</b></> : "Let's get you placement-ready"}
            {profile?.passoutYear ? ` · Class of ${profile.passoutYear}` : ""}
          </p>
        </div>
        <dl className="flex gap-6 text-sm">
          <div><dt className="text-muted">Answered</dt><dd className="text-xl font-bold tabular-nums">{answered}</dd></div>
          <div><dt className="text-muted">Accuracy</dt><dd className="text-xl font-bold tabular-nums">{answered ? pct(correct / answered) : "—"}</dd></div>
          <div><dt className="text-muted">Best mock</dt><dd className="text-xl font-bold tabular-nums">{history.length ? pct(best) : "—"}</dd></div>
        </dl>
      </div>

      {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</p>}

      {inProgress.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">You have an unfinished test</p>
          <ul className="mt-2 space-y-2 text-sm">
            {inProgress.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{a.title}{a.mode === "MOCK" && " · the timer keeps running while you're away"}</span>
                <Link href={`/attempt/${a.id}`} className={QUIZ_BTN}>Resume →</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick access: everything one tap away, however many mocks there are */}
      <nav aria-label="Quick access" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { href: "#exams", title: "Full mocks", sub: `${EXAMS.length} exams` },
          { href: "#section-quizzes", title: "Section quizzes", sub: "10 Q · instant answers" },
          { href: "#topic-quizzes", title: "Topic quizzes", sub: `${stats.length} topics` },
          { href: "/practice", title: "Custom quiz", sub: "pick topics & count" },
          ...(hasCodeAccess(user)
            ? [
                { href: "/code", title: "Code practice", sub: "C++ · Java · SQL" },
                { href: "/dsa", title: "DSA track", sub: "topic by topic" },
              ]
            : []),
        ].map((t) => (
          <Link key={t.href} href={t.href} className="rounded-xl border border-deep/10 bg-surface px-4 py-3 transition hover:border-brand/40 hover:bg-brand-soft">
            <span className="block text-sm font-semibold">{t.title}</span>
            <span className="block text-xs text-muted">{t.sub}</span>
          </Link>
        ))}
      </nav>

      {/* Exams: compact cards; the full pattern sits behind "Pattern & rules" */}
      <section id="exams" className="scroll-mt-20">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold">Full mock exams</h2>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">{EXAMS.length} available</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Each copies the company&apos;s pattern, sectional timers and proctoring (full-screen, no going back, auto-submit at {MAX_VIOLATIONS} warnings).{" "}
          <b className="text-deep">Every attempt is a fresh paper</b>: questions you&apos;ve already seen are skipped.
        </p>
        {featured.length > 0 && (
          <div className="mt-4">
            <ExamCarousel
              labels={featured.map((e) => `${e.company} ${e.name}`)}
              slides={featured.map((exam) => <FeaturedExamCard key={exam.id} exam={exam} {...examStats(exam)} isDream={isDreamExam(exam.company)} />)}
            />
          </div>
        )}
        {featured.length > 0 && gridExams.length > 0 && <h3 className="mt-6 text-sm font-semibold tracking-wider text-muted uppercase">More mocks</h3>}
        <div className={`${featured.length ? "mt-3" : "mt-4"} grid gap-4 md:grid-cols-2 xl:grid-cols-3`}>
          {gridExams.map((exam) => {
            const q = exam.pattern.reduce((a, p) => a + p.questions, 0);
            const min = exam.pattern.reduce((a, p) => a + p.minutes, 0);
            const { taken, best } = examStats(exam);
            const isDream = isDreamExam(exam.company);
            return (
              <article key={exam.id} className={`flex flex-col rounded-2xl p-5 ${isDream ? "bg-deep text-white" : "border border-deep/10 bg-surface"}`}>
                <p className={`text-xs font-semibold tracking-wider uppercase ${isDream ? "text-sun" : "text-muted"}`}>
                  {exam.company}{isDream ? " · your dream company" : ""}
                </p>
                <h3 className="mt-1 flex flex-wrap items-center gap-2 text-lg font-bold leading-tight">
                  {exam.name}
                  <LevelBadge level={exam.level} />
                </h3>
                <p className={`mt-1 text-sm ${isDream ? "text-white/70" : "text-muted"}`}>
                  {q} Q · {min} min · {exam.pattern.length} sections
                  {taken > 0 && <> · <span className={`font-semibold tabular-nums ${isDream ? "text-white" : "text-deep"}`}>{taken} taken, best {pct(best)}</span></>}
                </p>
                <details className="group mt-3 text-sm">
                  <summary className={`cursor-pointer select-none font-medium ${isDream ? "text-white/80 hover:text-white" : "text-brand-dark hover:underline"}`}>Pattern &amp; rules</summary>
                  <ol className="mt-2 space-y-1">
                    {exam.pattern.map((p, i) => (
                      <li key={p.section} className={`flex justify-between gap-2 rounded-lg px-3 py-1.5 ${isDream ? "bg-white/[0.07]" : "bg-canvas-deep"}`}>
                        <span>{i + 1}. {SECTION_LABELS[p.section]}</span>
                        <span className={`shrink-0 tabular-nums ${isDream ? "text-white/60" : "text-muted"}`}>{p.section === "writing" ? "1 essay" : `${p.questions} Q`} · {p.minutes} min</span>
                      </li>
                    ))}
                  </ol>
                  {exam.note && <p className={`mt-2 rounded-lg px-3 py-2 ${isDream ? "bg-white/10 text-white/80" : "bg-brand-soft/60 text-muted"}`}>{exam.note}</p>}
                </details>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <Link href={`/mock?exam=${exam.id}`} className={isDream ? "inline-flex items-center rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-deep transition hover:bg-white" : QUIZ_BTN}>
                    {taken ? "Take another" : "Start mock"} →
                  </Link>
                  <span className={`text-xs ${isDream ? "text-white/60" : "text-muted"}`}>~{min >= 90 ? `${Math.round(min / 60)} h` : `${min} min`}</span>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Coming soon:</span>
          {[...(hasCognizant ? [] : ["Cognizant GenC"]), ...upcoming.filter((c) => !(c.toLowerCase() === "cognizant" && !hasCognizant))].map((c) => {
            const isDreamSoon = !!dream && !dreamIsAvailable && c.toLowerCase().includes(dream.toLowerCase());
            return (
              <span key={c} className={`rounded-full px-3 py-1 text-xs font-medium ${isDreamSoon ? "bg-sun text-deep" : "bg-canvas-deep text-muted"}`}>
                {c}{isDreamSoon ? " · your dream company" : ""}
              </span>
            );
          })}
        </div>
        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD} className="mt-6" />
      </section>

      {/* Quick actions + recommendations */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-deep/10 bg-surface p-6 lg:col-span-2">
          <h2 className="text-xl font-bold">Recommended for you</h2>
          <p className="mt-1 text-sm text-muted">Ranked by how often a topic appears in the test and how shaky you are on it.</p>
          <ul className="mt-4 divide-y divide-deep/5">
            {recs.map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted">{r.reason}</p>
                </div>
                {r.topicIds?.length ? (
                  <QuizButton topics={r.topicIds} count={12}>Start 12</QuizButton>
                ) : r.topicId ? (
                  <QuizButton topics={[r.topicId]} timed={r.kind === "speed"}>Start 10</QuizButton>
                ) : r.kind === "mistakes" ? (
                  <form action={retryMistakes}><SubmitButton className={QUIZ_BTN}>Retry</SubmitButton></form>
                ) : (
                  <Link href="/mock" className={QUIZ_BTN}>Open</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-deep/10 bg-surface p-6">
            <h2 className="font-bold">Retry your mistakes</h2>
            <p className="mt-1 text-sm text-muted">
              {wrong.length ? `${wrong.length} question${wrong.length === 1 ? "" : "s"} you got wrong recently.` : "Nothing to retry yet. Wrong answers collect here."}
            </p>
            {wrong.length > 0 && <form action={retryMistakes} className="mt-3"><SubmitButton className={QUIZ_BTN}>Retry now</SubmitButton></form>}
          </div>
          <div className="rounded-2xl border border-deep/10 bg-surface p-6">
            <h2 className="font-bold">Timed speed drill</h2>
            <p className="mt-1 text-sm text-muted">
              {weakest.length ? `Your 3 weakest topics, at exam pace: ${weakest.map((t) => t.label).join(", ")}.` : "Do a few quizzes first; then this drills your weakest topics at exam pace."}
            </p>
            {weakest.length > 0 && <div className="mt-3"><QuizButton topics={weakest.map((t) => t.id)} timed>Start drill</QuizButton></div>}
          </div>
        </div>
      </section>

      {/* Section quizzes */}
      <section id="section-quizzes" className="scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">Section quizzes</h2>
            <p className="mt-1 text-sm text-muted">10 mixed questions from one section, with instant answers. The line on each bar is the practice target.</p>
          </div>
          <Link href="/practice" className="text-sm font-semibold text-brand-dark hover:underline">Build a custom quiz →</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => {
            const ids = stats.filter((t) => t.section === s.section).sort((a, b) => b.weight - a.weight).map((t) => t.id);
            return (
              <div key={s.section} className="flex flex-col rounded-2xl border border-deep/10 bg-surface p-5">
                <h3 className="font-semibold">{s.label}</h3>
                <p className="mt-0.5 text-xs text-muted">{ids.length} topics · {s.attempted ? `${s.correct}/${s.attempted} correct · ${pct(s.readiness)} ready` : "not started"}</p>
                <div className="mt-3">
                  <ProgressBar value={s.attempted ? s.readiness : null} target={s.target} label={`${s.label} readiness`} />
                </div>
                <div className="mt-auto pt-4">
                  <QuizButton topics={ids} className={`${QUIZ_BTN} w-full`}>Start quiz</QuizButton>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Topic quizzes */}
      <section id="topic-quizzes" className="scroll-mt-20">
        <h2 className="text-xl font-bold">Topic quizzes</h2>
        <p className="mt-1 text-sm text-muted">Tap any topic for a 10-question quiz.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((s) => (
            <div key={s.section} className="rounded-2xl border border-deep/10 bg-surface p-5">
              <h3 className="text-sm font-semibold tracking-wider text-muted uppercase">{s.label}</h3>
              <ul className="mt-2 divide-y divide-deep/5">
                {stats
                  .filter((t) => t.section === s.section)
                  .sort((a, b) => b.weight - a.weight)
                  .map((t) => {
                    const tone = topicTone(t);
                    return (
                      <li key={t.id}>
                        <QuizButton
                          topics={[t.id]}
                          className="group flex w-full items-center justify-between gap-3 py-2 text-left text-sm hover:text-brand-dark"
                        >
                          <span className="flex items-center gap-2">
                            <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                            {t.label}
                          </span>
                          <span className="shrink-0 text-xs text-muted group-hover:text-brand-dark">
                            <span className="group-hover:hidden">{tone.note}</span>
                            <span className="hidden font-semibold group-hover:inline">Start →</span>
                          </span>
                        </QuizButton>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      {recent.length > 0 && (
        <section className="rounded-2xl border border-deep/10 bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Recent activity</h2>
            <Link href="/analytics" className="text-sm font-semibold text-brand-dark hover:underline">Full analytics →</Link>
          </div>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-deep/5">
              {recent.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 font-medium">{a.title}</td>
                  <td className="py-2 text-muted">{a.startedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  <td className="py-2 tabular-nums">{a.status === "SUBMITTED" ? `${a.score}/${a.maxScore}` : "in progress"}</td>
                  <td className="py-2 text-right">
                    <Link href={a.status === "SUBMITTED" ? `/results/${a.id}` : `/attempt/${a.id}`} className="font-semibold text-brand-dark hover:underline">
                      {a.status === "SUBMITTED" ? "Review" : "Resume"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

/** The full exam card (pattern, rules, note), used for admin-featured exams in the carousel. */
function FeaturedExamCard({ exam, taken, best, isDream }: { exam: Exam; taken: number; best: number; isDream: boolean }) {
  const q = exam.pattern.reduce((a, p) => a + p.questions, 0);
  const min = exam.pattern.reduce((a, p) => a + p.minutes, 0);
  return (
    <article className="h-full rounded-2xl bg-deep p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-sun uppercase">
            {exam.company} · featured{isDream ? " · your dream company" : ""}
          </p>
          <h3 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold">
            {exam.name}
            <LevelBadge level={exam.level} />
          </h3>
          <p className="mt-1 text-white/70">{q} questions · {min} min · {exam.pattern.length} timed sections · no negative marking</p>
        </div>
        {taken > 0 && <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm tabular-nums">{taken} taken · best {pct(best)}</span>}
      </div>
      <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {exam.pattern.map((p, i) => (
          <li key={p.section} className="rounded-xl bg-white/[0.07] px-3 py-2 text-sm">
            <span className="text-white/50">{i + 1}. </span>
            <span className="font-medium">{SECTION_LABELS[p.section]}</span>
            <span className="block text-xs text-white/60 tabular-nums">{p.section === "writing" ? "1 essay" : `${p.questions} Q`} · {p.minutes} min</span>
          </li>
        ))}
      </ol>
      <ul className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
        {["Full-screen", "Sectional timers", "No going back", `Auto-submit at ${MAX_VIOLATIONS} warnings`].map((f) => (
          <li key={f} className="rounded-full border border-white/15 px-2.5 py-1">{f}</li>
        ))}
      </ul>
      <p className="mt-4 rounded-lg bg-sun/15 px-3 py-2 text-sm text-sun">
        <b>New questions every attempt.</b> Each mock is a fresh set, and questions you&apos;ve already seen are skipped, so retaking it is never the same paper.
      </p>
      {exam.note && <p className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/80">{exam.note}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link href={`/mock?exam=${exam.id}`} className="inline-flex items-center gap-2 rounded-xl bg-sun px-5 py-2.5 font-semibold text-deep transition hover:bg-white">
          {taken ? "Take another mock" : "Take your first mock"} →
        </Link>
        <span className="text-sm text-white/60">Set aside about {min >= 90 ? `${Math.round(min / 60)} hours` : `${min} minutes`}</span>
      </div>
    </article>
  );
}
