import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { PROBLEM_BY_ID } from "@/lib/code/problems";
import { Editor } from "./Editor";

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const p = PROBLEM_BY_ID.get(id);
  if (!p) notFound();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <article className="space-y-4">
        <Link href="/code" className="text-sm text-slate-500 hover:text-deep">← All problems</Link>
        <h1 className="text-2xl font-bold">{p.title}</h1>
        <p className="text-sm text-slate-500">{p.difficulty} · {p.tags.join(" · ")}</p>
        <p>{p.statement}</p>
        <dl className="space-y-2 text-sm">
          <div><dt className="font-semibold">Input</dt><dd>{p.input}</dd></div>
          <div><dt className="font-semibold">Output</dt><dd>{p.output}</dd></div>
          <div><dt className="font-semibold">Constraints</dt><dd>{p.constraints}</dd></div>
        </dl>
        {p.samples.map((s, i) => (
          <div key={i} className="card space-y-2 text-sm">
            <div className="font-semibold">Sample {i + 1}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 font-mono text-xs"><span className="text-slate-400">Input</span>{"\n"}{s.input}</pre>
              <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 font-mono text-xs"><span className="text-slate-400">Output</span>{"\n"}{s.output}</pre>
            </div>
            {s.note && <p className="text-slate-600">{s.note}</p>}
          </div>
        ))}
      </article>
      <Editor problemId={p.id} sampleInput={p.samples[0].input} />
    </div>
  );
}
