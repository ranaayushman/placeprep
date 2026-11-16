import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PROBLEMS } from "@/lib/code/problems";
import { Workspace, type ProblemLink, type PublicProblem } from "./Workspace";

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const found = PROBLEMS.find((p) => p.id === id);
  if (!found) notFound();
  // A DSA problem navigates within the DSA track; the rest within the placement list.
  const isDsa = found.tier === "dsa";
  const list = PROBLEMS.filter((p) => (p.tier === "dsa") === isDsa);
  const i = list.indexOf(found);
  const { tests: _hidden, ...pub } = found; // hidden tests never reach the browser
  const problems: ProblemLink[] = list.map(({ id, title, difficulty }) => ({ id, title, difficulty }));
  const back = isDsa ? { href: "/dsa", label: "DSA track" } : { href: "/code", label: "All problems" };
  return <Workspace problem={pub satisfies PublicProblem} index={i + 1} problems={problems} prev={list[i - 1]?.id} next={list[i + 1]?.id} back={back} />;
}
