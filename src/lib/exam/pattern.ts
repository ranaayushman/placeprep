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
 * Deloitte National Level Assessment, used for Cyber Gurukul / Analyst Trainee drives, as reported
 * for 2024–2026 (several sources; Deloitte does not publish it): sectional timers, ~1 min per MCQ.
 *
 *   Verbal 13 Q / 13 min   Reasoning 12 Q / 12 min   Quant 10 Q / 10 min   Technical 30 Q / 30 min
 *
 * The real test also has a coding round (2 problems, ~25–35 min), which is not simulated here.
 */
export const DELOITTE_NLA_PATTERN: SectionSpec[] = [
  { section: "verbal", questions: 13, minutes: 13 },
  { section: "reasoning", questions: 12, minutes: 12 },
  { section: "math", questions: 10, minutes: 10 },
  { section: "technical", questions: 30, minutes: 30 },
];

/** Exams students can take as full mocks. Add an entry when a new company's pattern exists. */
export const EXAMS = [
  { id: "infosys-se", company: "Infosys", name: "Systems Engineer (SE) online test", short: "Infosys SE", pattern: INFOSYS_SE_PATTERN, note: null },
  {
    id: "deloitte-nla",
    company: "Deloitte",
    name: "Cyber Gurukul · Analyst Trainee (NLA)",
    short: "Deloitte NLA",
    pattern: DELOITTE_NLA_PATTERN,
    note: "The real test also has a coding round (2 problems). It is not simulated here yet, so practise coding separately.",
  },
] as const;
export type ExamId = (typeof EXAMS)[number]["id"];
export const EXAM_BY_ID = new Map<string, (typeof EXAMS)[number]>(EXAMS.map((e) => [e.id, e]));

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
  technical: 0.6,
};

/** Auto-submit the mock after this many proctoring violations. */
export const MAX_VIOLATIONS = 3;

/** Grace period for answers that arrive just after a section timer ends (network latency). */
export const SUBMIT_GRACE_MS = 5000;

/**
 * The open test page checks in every HEARTBEAT_MS. No check-in for LEFT_AFTER_MS (tab closed, left
 * the page, phone locked) means the student left: the test is submitted and scored as it stands.
 */
export const HEARTBEAT_MS = 30 * 1000;
export const LEFT_AFTER_MS = 3 * 60 * 1000;
