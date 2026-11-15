import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PROBLEMS } from "@/lib/code/problems";
import { Workspace, type ProblemLink, type PublicProblem } from "./Workspace";

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const i = PROBLEMS.findIndex((p) => p.id === id);
  if (i < 0) notFound();
  const { tests: _hidden, ...pub } = PROBLEMS[i]; // hidden tests never reach the browser
  const problems: ProblemLink[] = PROBLEMS.map(({ id, title, difficulty }) => ({ id, title, difficulty }));
  return <Workspace problem={pub satisfies PublicProblem} index={i + 1} problems={problems} prev={PROBLEMS[i - 1]?.id} next={PROBLEMS[i + 1]?.id} />;
}
