import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { listExams, staffMockExams } from "@/lib/exam/exams";
import { SECTION_LABELS, type SectionId } from "@/lib/questions";

export const dynamic = "force-dynamic";

const summary = (p: readonly { section: string; questions: number; minutes: number }[]) =>
  `${p.length} sections · ${p.reduce((a, s) => a + s.questions, 0)} questions · ${p.reduce((a, s) => a + s.minutes, 0)} min`;

export default async function MockExamsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const me = await requireStaff();
  const { msg } = await searchParams;
  const [rows, all] = await Promise.all([staffMockExams(), listExams()]);
  const builtIn = all.filter((e) => e.builtIn);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mock exams</h1>
          <p className="text-sm text-slate-500">
            Create a company&apos;s pattern: sections, question counts and timers. {me.role === "ADMIN" ? "Drafts go live when you publish them." : "An admin publishes drafts for students."}
          </p>
        </div>
        <Link href="/admin/mocks/new" className="btn-primary">New mock</Link>
      </div>
      {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
      <ul className="space-y-3">
        {rows.map((m) => (
          <li key={m.id} className="card flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <Link href={`/admin/mocks/${m.id}`} className="font-semibold hover:underline">{m.company} · {m.name}</Link>
              <p className="text-xs text-slate-500">{summary(m.pattern)}</p>
            </div>
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${m.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
              {m.status === "PUBLISHED" ? "Live" : "Draft"}
            </span>
          </li>
        ))}
        {builtIn.map((e) => (
          <li key={e.id} className="card flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold">{e.company} · {e.name}</p>
              <p className="text-xs text-slate-500">{e.pattern.map((s) => SECTION_LABELS[s.section as SectionId]).join(" → ")}</p>
            </div>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Live · built in</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
