import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { attempts, db, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { getTopicStats, mockHistory, recommend, sectionStats, type TopicStat } from "@/lib/analytics";
import { wrongRefs } from "@/lib/exam/service";
import { INFOSYS_SE_PATTERN, MAX_VIOLATIONS } from "@/lib/exam/pattern";
import { ProgressBar, pct } from "@/components/charts";
import { SECTION_LABELS } from "@/lib/questions";
import { retryMistakes, startPractice } from "../start-actions";

/** Exams students can take today. Add an entry here when a new company's pattern and question bank exist. */
const EXAMS = [{ company: "Infosys", name: "Systems Engineer (SE) online test", href: "/mock", pattern: INFOSYS_SE_PATTERN }];

/** Recruiters students ask for most. Only Infosys has a real pattern + bank today; the rest are shown as "coming soon". */
const UPCOMING_COMPANIES = ["TCS", "Wipro", "Accenture", "Cognizant", "Capgemini"];

const QUIZ_BTN =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-brand-dark px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-deep";

/** One-tap practice set: a tiny form posting the topics to the existing startPractice action. */
function QuizButton({ topics, count = 10, timed = false, children, className = QUIZ_BTN }: { topics: string[]; count?: number; timed?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <form action={startPractice}>
      {topics.map((t) => <input key={t} type="hidden" name="topic" value={t} />)}
      <input type="hidden" name="count" value={count} />
      {timed && <input type="hidden" name="timed" value="on" />}
      <button className={className}>{children}</button>
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
  const dreamIsInfosys = dream?.toLowerCase().includes("infosys");
  // Put the student's dream company first among the upcoming ones.
  const upcoming = dream && !dreamIsInfosys ? [dream, ...UPCOMING_COMPANIES.filter((c) => c.toLowerCase() !== dream.toLowerCase())].slice(0, 5) : UPCOMING_COMPANIES;
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

      {/* Exams available now + coming soon */}
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold">Exams available now</h2>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
            {EXAMS.length} {EXAMS.length === 1 ? "exam" : "exams"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">Full-length mocks that copy the company&apos;s pattern, timers and proctoring rules.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            {EXAMS.map((exam) => {
              const q = exam.pattern.reduce((a, p) => a + p.questions, 0);
              const min = exam.pattern.reduce((a, p) => a + p.minutes, 0);
              return (
                <article key={exam.href} className="rounded-2xl bg-deep p-6 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-sun uppercase">{exam.company} · available</p>
                      <h3 className="mt-1 text-2xl font-bold">{exam.name}</h3>
                      <p className="mt-1 text-white/70">{q} questions · {min} min · {exam.pattern.length} timed sections · no negative marking</p>
                    </div>
                    {history.length > 0 && (
                      <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm tabular-nums">{history.length} taken · best {pct(best)}</span>
                    )}
                  </div>
                  <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {exam.pattern.map((p, i) => (
                      <li key={p.section} className="rounded-xl bg-white/[0.07] px-3 py-2 text-sm">
                        <span className="text-white/50">{i + 1}. </span>
                        <span className="font-medium">{SECTION_LABELS[p.section]}</span>
                        <span className="block text-xs text-white/60 tabular-nums">
                          {p.section === "writing" ? "1 essay" : `${p.questions} Q`} · {p.minutes} min
                        </span>
                      </li>
                    ))}
                  </ol>
                  <ul className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
                    {["Full-screen", "Sectional timers", "No going back", `Auto-submit at ${MAX_VIOLATIONS} warnings`].map((f) => (
                      <li key={f} className="rounded-full border border-white/15 px-2.5 py-1">{f}</li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link href={exam.href} className="inline-flex items-center gap-2 rounded-xl bg-sun px-5 py-2.5 font-semibold text-deep transition hover:bg-white">
                      {history.length ? "Take another mock" : "Take your first mock"} →
                    </Link>
                    <span className="text-sm text-white/60">Set aside about {Math.ceil(min / 60)} hours</span>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="rounded-2xl border border-deep/10 bg-surface p-6">
            <p className="text-xs font-semibold tracking-wider text-muted uppercase">Coming soon</p>
            <ul className="mt-3 space-y-2">
              {upcoming.map((c, i) => (
                <li key={c} className="flex items-center justify-between rounded-xl bg-canvas-deep px-4 py-2.5 text-sm">
                  <span className="font-medium">{c}</span>
                  {i === 0 && dream && !dreamIsInfosys ? (
                    <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-semibold">Your dream company</span>
                  ) : (
                    <span className="text-xs text-muted">soon</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Until then, the aptitude, reasoning and verbal practice here carries over to most service-company tests.</p>
          </div>
        </div>
      </section>

      {/* Section quizzes */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">Section quizzes</h2>
            <p className="mt-1 text-sm text-muted">10 mixed questions from one section, with instant answers. The line on each bar is the practice target.</p>
          </div>
          <Link href="/practice" className="text-sm font-semibold text-brand-dark hover:underline">Build a custom quiz →</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {sections.map((s) => {
            const ids = stats.filter((t) => t.section === s.section).sort((a, b) => b.weight - a.weight).map((t) => t.id);
            return (
              <div key={s.section} className="flex flex-col rounded-2xl border border-deep/10 bg-surface p-5">
                <h3 className="font-semibold">{s.label}</h3>
                <p className="mt-0.5 text-xs text-muted">{ids.length} topics · {s.attempted ? `${pct(s.readiness)} ready` : "not started"}</p>
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
      <section>
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
                  <form action={retryMistakes}><button className={QUIZ_BTN}>Retry</button></form>
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
            {wrong.length > 0 && <form action={retryMistakes} className="mt-3"><button className={QUIZ_BTN}>Retry now</button></form>}
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
