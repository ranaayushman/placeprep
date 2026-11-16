import { requireUser } from "@/lib/auth";
import { DSA_PROBLEMS } from "@/lib/code/dsa";
import { DsaTrack, type TrackTopic } from "./DsaTrack";

export const metadata = { title: "DSA track" };

export default async function DsaPage() {
  await requireUser();
  const topics: TrackTopic[] = [...new Set(DSA_PROBLEMS.map((p) => p.topic))].map((name) => ({
    name,
    problems: DSA_PROBLEMS.filter((p) => p.topic === name).map(({ id, title, difficulty, tags }) => ({ id, title, difficulty, tags })),
  }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">DSA track (C++)</h1>
        <p className="text-slate-500">Topic-by-topic problems, easy to hard. Write the brute force and its complexity first, then optimise. Submit against the hidden tests.</p>
      </div>
      <DsaTrack topics={topics} />
    </div>
  );
}
