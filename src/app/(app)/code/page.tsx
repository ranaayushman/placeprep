import Link from "next/link";
import { requireCodeAccess } from "@/lib/auth";
import { PROBLEMS, type Problem } from "@/lib/code/problems";
import { DSA_PROBLEMS } from "@/lib/code/dsa";
import { SolvedMark } from "./SolvedMark";

export const metadata = { title: "Code practice" };

export default async function CodePage() {
  await requireCodeAccess();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Code practice (C++ / Java)</h1>
        <p className="text-slate-500">Short array and string problems in the style of the Deloitte NLA coding section. Write C++17 or Java, run it on your own input, then submit against the hidden tests.</p>
      </div>
      <Link href="/dsa" className="card flex items-center gap-4 border-brand/30 bg-brand-soft/40 hover:bg-brand-soft">
        <div className="flex-1">
          <p className="font-semibold text-deep">DSA track (C++) →</p>
          <p className="text-sm text-muted">{DSA_PROBLEMS.length} problems, topic by topic, with progress tracking.</p>
        </div>
      </Link>
      <ProblemList problems={PROBLEMS.filter((p) => p.tier !== "dsa")} />
    </div>
  );
}

function ProblemList({ problems }: { problems: Problem[] }) {
  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {problems.map((p, i) => (
        <li key={p.id}>
          <Link href={`/code/${p.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-brand-soft">
            <SolvedMark id={p.id} />
            <span className="w-6 text-sm text-slate-400">{i + 1}.</span>
            <span className="flex-1 font-medium">{p.title}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{p.difficulty}</span>
            <span className="text-xs text-slate-500">{p.tags.join(" · ")}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
