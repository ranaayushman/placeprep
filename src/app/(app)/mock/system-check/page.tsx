import Link from "next/link";
import { getExam, listExams } from "@/lib/exam/exams";
import { StartMockForm } from "../StartMockForm";

export default async function SystemCheckPage({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const exam = (await getExam((await searchParams).exam ?? "")) ?? (await listExams())[0];
  const hasWriting = exam.pattern.some((s) => s.section === "writing");
  const mcqMinutes = exam.pattern.filter((s) => s.section !== "writing").reduce((total, section) => total + section.minutes, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/mock?exam=${exam.id}`} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to mock details
        </Link>
        <h1 className="mt-2 text-2xl font-bold">System check</h1>
        <p className="mt-1 text-slate-500">
          Complete the camera, network, screen, and fullscreen checks before starting the {exam.company} mock.
        </p>
      </div>

      <div className="card bg-slate-50 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Before you begin</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Use a desktop or laptop with a working camera.</li>
          <li>Keep this tab open and stay connected to the internet.</li>
          <li>Allow camera access and enter browser fullscreen when prompted.</li>
        </ul>
      </div>

      <StartMockForm
        examId={exam.id}
        hasWriting={hasWriting}
        questionCount={exam.pattern.reduce((total, section) => total + section.questions, 0)}
        minutes={mcqMinutes}
      />
    </div>
  );
}
