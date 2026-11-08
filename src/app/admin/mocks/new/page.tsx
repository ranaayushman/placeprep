import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { MAX_MOCK_SECTIONS, MOCK_SECTIONS } from "@/lib/exam/exams";
import { SECTION_LABELS } from "@/lib/questions";
import { MockExamForm } from "../MockExamForm";

export default async function NewMockPage() {
  await requireStaff();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/mocks" className="text-sm text-slate-500 hover:text-slate-900">← Mock exams</Link>
      <h1 className="text-2xl font-bold">New mock exam</h1>
      <MockExamForm sections={MOCK_SECTIONS.map((id) => ({ id, label: SECTION_LABELS[id] }))} maxSections={MAX_MOCK_SECTIONS} />
    </div>
  );
}
