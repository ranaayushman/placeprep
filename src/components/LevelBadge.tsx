import type { ExamLevel } from "@/lib/exam/pattern";

/** "Normal" / "Hard" / "Extreme" pill shown next to a mock's name. */
export function LevelBadge({ level }: { level: ExamLevel }) {
  if (level === "max") return <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">Extreme</span>;
  return level === "hard" ? (
    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">Hard</span>
  ) : (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Normal</span>
  );
}
