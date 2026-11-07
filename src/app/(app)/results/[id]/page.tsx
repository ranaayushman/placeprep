import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ExamError, getResult } from "@/lib/exam/service";
import { PRACTICE_TARGETS } from "@/lib/exam/pattern";
import { SECTION_LABELS, TOPIC_BY_ID, type QuestionView, type SectionId } from "@/lib/questions";
import { OPTION_LETTERS, QuestionBody } from "@/components/QuestionBody";
import { ReportProblem } from "@/components/ReportProblem";
import { ProgressBar, pct } from "@/components/charts";
import { startPractice } from "../../start-actions";

export default async function ResultsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ auto?: string; filter?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { auto, filter = "all" } = await searchParams;
  let data;
  try {
    data = await getResult(id, user.id);
  } catch (e) {
    if (e instanceof ExamError) notFound();
    throw e;
  }
  const { attempt, questions } = data;
  if (attempt.status !== "SUBMITTED") redirect(`/attempt/${id}`);

  const mcqs = questions.filter((q) => q.answerIndex >= 0);
  const sectionIds = [...new Set(questions.map((q) => q.section))] as SectionId[];
  const bySection = sectionIds.map((s) => {
    const qs = mcqs.filter((q) => q.section === s);
    const correct = qs.filter((q) => q.isCorrect).length;
    const time = questions.filter((q) => q.section === s).reduce((a, q) => a + q.timeSpentMs, 0);
    return { s, total: qs.length, correct, skipped: qs.filter((q) => q.chosenIndex == null).length, time };
  });
  const weakTopics = [...new Set(mcqs.filter((q) => !q.isCorrect).map((q) => q.topic))];
  const shown = questions.filter((q) =>
    filter === "wrong" ? q.answerIndex >= 0 && q.isCorrect === false : filter === "skipped" ? q.answerIndex >= 0 && q.chosenIndex == null : true,
  );
  const essay = questions.find((q) => q.answerIndex < 0);

  return (
    <div className="space-y-6">
      {auto && attempt.autoSubmitted && (
        <div className="card border-red-300 bg-red-50 text-red-800">
          This test was submitted automatically after {attempt.violations} proctoring warnings.
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{attempt.mode === "MOCK" ? "Mock test result" : "Practice result"}</p>
          <h1 className="text-2xl font-bold">{attempt.title}</h1>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold tabular-nums">{attempt.score}<span className="text-xl text-slate-400">/{attempt.maxScore}</span></p>
          <p className="text-sm text-slate-500">{pct(attempt.maxScore ? (attempt.score ?? 0) / attempt.maxScore : null)} correct{attempt.mode === "MOCK" ? ` · ${attempt.violations} warnings${attempt.cameraOff ? " · camera off" : ` · ${attempt.cameraAlerts} camera alerts`}` : ""}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bySection.filter((b) => b.total > 0).map((b) => {
          const acc = b.correct / b.total;
          const target = PRACTICE_TARGETS[b.s] ?? 0.6;
          return (
            <div key={b.s} className="card">
              <div className="flex justify-between">
                <p className="font-semibold">{SECTION_LABELS[b.s]}</p>
                {attempt.mode === "MOCK" && (
                  <span className={`text-xs font-semibold ${acc >= target ? "text-emerald-600" : "text-amber-600"}`}>{acc >= target ? "On target" : "Below target"}</span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">{b.correct}/{b.total}</p>
              <div className="mt-2"><ProgressBar value={acc} target={attempt.mode === "MOCK" ? target : undefined} /></div>
              <p className="mt-2 text-xs text-slate-500">{b.skipped} skipped · {Math.round(b.time / 60000)} min spent</p>
            </div>
          );
        })}
      </div>

      {weakTopics.length > 0 && (
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Practise what you missed</p>
            <p className="text-sm text-slate-500">{weakTopics.map((t) => TOPIC_BY_ID.get(t)?.label).join(", ")}</p>
          </div>
          <form action={startPractice}>
            {weakTopics.slice(0, 6).map((t) => <input key={t} type="hidden" name="topic" value={t} />)}
            <input type="hidden" name="count" value="10" />
            <button className="btn-primary">10 new questions on these</button>
          </form>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Review answers</h2>
          <div className="flex gap-1 text-sm">
            {(["all", "wrong", "skipped"] as const).map((f) => (
              <Link key={f} href={`?filter=${f}`} className={`rounded-md px-3 py-1 ${filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>{f[0].toUpperCase() + f.slice(1)}</Link>
            ))}
          </div>
        </div>
        <ol className="space-y-4">
          {shown.map((q) => {
            const view = JSON.parse(q.payload) as QuestionView;
            if (q.answerIndex < 0) return null;
            return (
              <li key={q.id} className="card">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">{SECTION_LABELS[q.section as SectionId]} · Q{q.order + 1} · {TOPIC_BY_ID.get(q.topic)?.label}</span>
                  <span className={`rounded px-2 py-0.5 font-semibold ${q.isCorrect ? "bg-emerald-100 text-emerald-700" : q.chosenIndex == null ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-700"}`}>
                    {q.isCorrect ? "Correct" : q.chosenIndex == null ? "Skipped" : "Wrong"} · {Math.round(q.timeSpentMs / 1000)}s
                  </span>
                </div>
                <QuestionBody q={view} />
                <ul className="mt-4 space-y-1.5 text-sm">
                  {view.options.map((o, i) => (
                    <li key={i} className={`rounded-md border px-3 py-2 ${i === q.answerIndex ? "border-emerald-400 bg-emerald-50" : i === q.chosenIndex ? "border-red-400 bg-red-50" : "border-slate-200"}`}>
                      <b className="mr-2">{OPTION_LETTERS[i]}.</b>{o}
                      {i === q.answerIndex && <span className="ml-2 text-xs font-semibold text-emerald-700">correct</span>}
                      {i === q.chosenIndex && i !== q.answerIndex && <span className="ml-2 text-xs font-semibold text-red-700">your answer</span>}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700"><b>Explanation: </b>{q.explanation}</p>
                {view.community && <ReportProblem questionId={view.community.id} />}
              </li>
            );
          })}
        </ol>
      </section>

      {essay && filter === "all" && (
        <section className="card">
          <h2 className="font-semibold">Writing test</h2>
          <p className="mt-1 text-sm font-medium">{(JSON.parse(essay.payload) as QuestionView).prompt}</p>
          <div className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">{essay.textAnswer || <i className="text-slate-400">No answer written.</i>}</div>
          <p className="mt-2 text-xs text-slate-500">{essay.textAnswer?.trim() ? essay.textAnswer.trim().split(/\s+/).length : 0} words</p>
          <p className="mt-3 text-sm text-slate-700"><b>Self-review: </b>{essay.explanation}</p>
        </section>
      )}
    </div>
  );
}
