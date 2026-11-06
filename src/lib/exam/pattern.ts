import type { SectionId } from "@/lib/questions/types";

/**
 * Infosys SE online test pattern as reported for recent campus drives (2024–2026).
 * Sources disagree slightly (some list a separate 5-question grammar section, some list the
 * essay at 10 or 20 minutes), so this is the most commonly reported version. Edit freely.
 *
 *   Reasoning   15 Q / 25 min      Mathematical 10 Q / 35 min     Verbal 20 Q / 20 min
 *   Pseudocode   5 Q / 10 min      Puzzles       4 Q / 10 min     Writing 1 essay / 20 min
 *
 * No negative marking; each section has its own cut-off and its own timer, and you cannot
 * return to a section once it is submitted.
 */
export interface SectionSpec {
  section: SectionId;
  questions: number;
  minutes: number;
}

export const INFOSYS_SE_PATTERN: SectionSpec[] = [
  { section: "reasoning", questions: 15, minutes: 25 },
  { section: "math", questions: 10, minutes: 35 },
  { section: "verbal", questions: 20, minutes: 20 },
  { section: "pseudocode", questions: 5, minutes: 10 },
  { section: "puzzle", questions: 4, minutes: 10 },
  { section: "writing", questions: 1, minutes: 20 },
];

/**
 * Infosys does not publish cut-offs. These are practice targets (fraction correct per section)
 * based on what candidates commonly report being "safe". Treat them as a goal, not a fact.
 */
export const PRACTICE_TARGETS: Partial<Record<SectionId, number>> = {
  reasoning: 0.6,
  math: 0.6,
  verbal: 0.65,
  pseudocode: 0.6,
  puzzle: 0.5,
};

/** Auto-submit the mock after this many proctoring violations. */
export const MAX_VIOLATIONS = 3;

/** Grace period for answers that arrive just after a section timer ends (network latency). */
export const SUBMIT_GRACE_MS = 5000;
