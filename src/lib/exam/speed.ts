import { TOPIC_BY_ID } from "@/lib/questions";

export type Speed = { avgSec: number; targetSec: number; answered: number };

/**
 * Average seconds per answered question, and the target pace for those same questions (each
 * topic's targetSec). Skipped questions and essays don't count. Null when nothing was answered.
 */
export function speedOf(qs: { timeSpentMs: number; chosenIndex: number | null; answerIndex: number; topic: string }[]): Speed | null {
  const answered = qs.filter((q) => q.answerIndex >= 0 && q.chosenIndex != null && q.timeSpentMs > 0);
  if (!answered.length) return null;
  const sum = (f: (q: (typeof answered)[number]) => number) => answered.reduce((a, q) => a + f(q), 0);
  return {
    avgSec: sum((q) => q.timeSpentMs) / 1000 / answered.length,
    targetSec: sum((q) => TOPIC_BY_ID.get(q.topic)?.targetSec ?? 60) / answered.length,
    answered: answered.length,
  };
}

/** "Fast" up to the target, "steady" up to 1.3× it, otherwise "slow". */
export const paceOf = (s: Speed) => (s.avgSec <= s.targetSec ? "fast" : s.avgSec <= s.targetSec * 1.3 ? "steady" : "slow");
export const PACE_TONE = { fast: "text-emerald-700", steady: "text-amber-700", slow: "text-red-700" } as const;
export const fmtSec = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`);
