import Link from "next/link";
import { MAX_VIOLATIONS } from "@/lib/exam/pattern";
import { listExams } from "@/lib/exam/exams";
import { SECTION_LABELS } from "@/lib/questions";

export default async function MockPage({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const EXAMS = await listExams();
  const wanted = (await searchParams).exam;
  const exam = EXAMS.find((e) => e.id === wanted) ?? EXAMS[0];
  const hasWriting = exam.pattern.some((s) => s.section === "writing");
  const mcqMinutes = exam.pattern.filter((s) => s.section !== "writing").reduce((a, s) => a + s.minutes, 0);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        {EXAMS.length > 1 && (
          <nav className="mb-4 flex flex-wrap gap-2" aria-label="Choose an exam">
            {EXAMS.map((e) => (
              <Link
                key={e.id}
                href={`/mock?exam=${e.id}`}
                aria-current={e.id === exam.id ? "page" : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${e.id === exam.id ? "border-brand bg-brand-soft text-brand-dark" : "border-slate-200 bg-white text-slate-600 hover:border-brand"}`}
              >
                {e.company}
              </Link>
            ))}
            {!EXAMS.some((e) => e.company.toLowerCase() === "cognizant") && (
              <span className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-400" title="A Cognizant GenC mock is coming soon">
                Cognizant · soon
              </span>
            )}
          </nav>
        )}
        <h1 className="text-2xl font-bold">{exam.company} · {exam.name}</h1>
        <p className="text-slate-500">A complete mock in the reported pattern, with the real exam rules. Set aside about {mcqMinutes + (hasWriting ? 20 : 0)} minutes.</p>
        {exam.note && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{exam.note}</p>}
      </div>

      <div className="card">
        <h2 className="font-semibold">Sections</h2>
        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {exam.pattern.map((s) => (
              <tr key={s.section}>
                <td className="py-2 font-medium">{SECTION_LABELS[s.section]}</td>
                <td className="py-2 tabular-nums text-slate-600">{s.questions} {s.section === "writing" ? "essay" : "questions"}</td>
                <td className="py-2 text-right tabular-nums text-slate-600">{s.minutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="font-semibold">Rules</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li><b>New questions every attempt.</b> Each mock is a fresh set, and questions you&apos;ve already seen are skipped, so retaking it is never the same paper.</li>
          <li>Each section has its <b>own timer</b>. When it runs out, the section is submitted automatically.</li>
          <li>Once you submit a section you <b>cannot go back</b> to it. Within a section you can move freely.</li>
          <li><b>No negative marking</b> — attempt every question. Every section has its own cut-off.</li>
          <li>The test runs in <b>full screen</b>. Leaving full screen, switching tabs or windows counts as a warning. At {MAX_VIOLATIONS} warnings the test is submitted automatically.</li>
          <li>With camera proctoring on, times your face isn&apos;t visible, you look away, or another face appears are counted as <b>camera alerts</b> and shown on your result. They never end the test, and looking down at rough paper for a few seconds is fine.</li>
          <li>Copy, paste, right-click and developer tools are disabled. Keep rough paper and a pen ready — calculators are not allowed.</li>
          <li>Closing the tab does not pause the timer. If you leave the test for more than 3 minutes, it is submitted and scored with the answers you saved.</li>
        </ul>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4">
        <span className="text-sm text-slate-500">Ready? Complete the system check before starting.</span>
        <Link href={`/mock/system-check?exam=${exam.id}`} className="btn-primary px-6 py-3">
          Continue to system check
        </Link>
      </div>
    </div>
  );
}
