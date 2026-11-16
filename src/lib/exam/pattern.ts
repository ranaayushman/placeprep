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
  /**
   * Optional, per exam: topic id → weight for this section. When set, only these topics are served
   * (at these weights) instead of every topic of the section at its default weight.
   */
  topics?: Record<string, number>;
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
 * Deloitte National Level Assessment (NLA), used for the Cyber Gurukul · Analyst Trainee drives
 * (2024–2027 batches). Deloitte does not publish the paper; this follows the pattern that prep sites
 * and candidate write-ups agree on (PrepInsta, Tech6Sense, onlinestudy4u, GeeksforGeeks, Nov 2026):
 * HirePro, 90 min, five sections each with its own timer (no going back), no negative marking.
 *
 *   English 13 Q (10 MCQ + 3 fill-ups) / 13 min   Reasoning 12 Q / 12 min   Quant 10 Q / 10 min
 *   Technical 30 Q / 30 min   Coding 2 Q (1 nugget + 1 program) / 25 min
 *
 * Topic weights per section mirror the questions reported from real papers:
 *  - English: error spotting, sentence correction, fill-ups, voice, para jumble, synonym/antonym,
 *    one-word substitution; one short RC passage.
 *  - Reasoning: letter puzzles, statement/assumption/conclusion, series, coding, blood relations,
 *    data sufficiency, direction, arrangement, syllogism. No clocks or calendars reported.
 *  - Quant: profit & loss, P&C, probability, time & work, speed/trains, mixtures, number system,
 *    interest, percentages, averages, mensuration. No data interpretation charts.
 *  - Technical: networking & cyber security dominate, then DBMS/SQL, programming & OOP,
 *    software testing, OS, cloud, computer fundamentals.
 *  - Coding: one short "nugget" (arrays/strings/maths, the PYQ types) and one medium program, judged on
 *    hidden tests in C++ or Java (the real test also allows C and Python). See lib/code/problems.ts.
 * Difficulty is easy to medium throughout, so the mock runs at the realistic (standard) tier.
 */
export const DELOITTE_NLA_PATTERN: SectionSpec[] = [
  { section: "verbal", questions: 13, minutes: 13, topics: { "v-correction": 3, "v-fill": 3, "v-error": 2, "v-vocab": 2, "v-jumble": 1, "v-voice": 1, "v-oneword": 1 } },
  {
    section: "reasoning",
    questions: 12,
    minutes: 12,
    topics: { "r-alpha": 3, "r-statement": 3, "r-series": 2, "r-coding": 2, "r-blood": 2, "r-ds": 2, "r-direction": 1, "r-seating": 1, "r-syllogism": 1, "r-odd": 1, "r-ranking": 1 },
  },
  {
    section: "math",
    questions: 10,
    minutes: 10,
    topics: { "m-profit": 3, "m-pnc": 3, "m-prob": 3, "m-timework": 3, "m-speed": 3, "m-ratio": 2, "m-number": 2, "m-interest": 2, "m-percent": 2, "m-average": 1, "m-mensuration": 1, "m-algebra": 1 },
  },
  {
    section: "technical",
    questions: 30,
    minutes: 30,
    topics: { "t-security": 5, "t-networks": 5, "t-dbms": 4, "t-programming": 4, "t-testing": 3, "t-os": 2, "t-cloud": 2, "t-fundamentals": 2 },
  },
  { section: "coding", questions: 2, minutes: 25, topics: { "c-nugget": 1, "c-program": 1 } },
];

/**
 * Cognizant GenC common assessment (GenC / GenC Pro / GenC Next share one paper; the technical score
 * decides the track). Cognizant publishes only the round names; sizes follow candidate reports from the
 * Nov–Dec 2025 drive (GeeksforGeeks, PrepInsta) and PlacementPreparation (Nov 2026):
 *
 *   Aptitude ~80 min: Quant 25 / 30 min, Logical 30 / 35 min, Verbal 15 / 15 min
 *   Technical 120 min, one timer: 2 coding + 2 SQL queries + 20 code-debugging MCQs + 10 tech MCQs.
 *   Clusters (chosen at the pre-placement talk): Java + SQL + web, or Python + SQL + cloud. One mock entry each.
 *
 * Not simulated yet: the 60-min AI communication round (speaking) and the game-based puzzles inside aptitude.
 * No negative marking.
 */
const GENC_APTITUDE: SectionSpec[] = [
  {
    section: "math",
    questions: 25,
    minutes: 30,
    topics: { "m-profit": 3, "m-timework": 3, "m-speed": 3, "m-percent": 3, "m-number": 2, "m-average": 2, "m-ratio": 2, "m-interest": 2, "m-pnc": 1, "m-prob": 1, "m-progression": 1, "m-mensuration": 1, "m-algebra": 1 },
  },
  {
    section: "reasoning",
    questions: 30,
    minutes: 35,
    topics: { "r-series": 4, "r-coding": 4, "r-blood": 3, "r-direction": 3, "r-seating": 3, "r-syllogism": 3, "r-ds": 2, "r-odd": 2, "r-ranking": 2, "r-alpha": 2, "r-statement": 2 },
  },
  { section: "verbal", questions: 15, minutes: 15, topics: { "v-correction": 4, "v-fill": 4, "v-vocab": 3, "v-error": 2, "v-jumble": 2 } },
];

export const COGNIZANT_GENC_PATTERN: SectionSpec[] = [
  ...GENC_APTITUDE,
  { section: "technical", questions: 34, minutes: 120, topics: { "c-genc": 2, "c-sql": 2, "t-debug": 20, "t-java": 6, "t-dbms": 4 } },
];

export const COGNIZANT_GENC_PYTHON_PATTERN: SectionSpec[] = [
  ...GENC_APTITUDE,
  { section: "technical", questions: 34, minutes: 120, topics: { "c-genc": 2, "c-sql": 2, "t-debug-py": 20, "t-python": 6, "t-dbms": 2, "t-cloud": 2 } },
];

/**
 * Difficulty of a mock: the share of each section's questions served from the hard tier
 * (see lib/questions/hard.ts), drawn at random within the range for every section of every mock.
 * Topics without a hard tier always stay standard, so a section can fall short of the range until
 * more topics get one.
 */
export type ExamLevel = "realistic" | "normal" | "hard";
export const HARD_SHARE_BY_LEVEL: Record<ExamLevel, readonly [min: number, max: number]> = { realistic: [0, 0], normal: [0.3, 0.5], hard: [0.7, 0.8] };

/** Exams students can take as full mocks. Add an entry when a new company's pattern exists. */
export const EXAMS = [
  { id: "infosys-se", company: "Infosys", name: "Systems Engineer (SE) online test · Mock 1", short: "Infosys SE 1", pattern: INFOSYS_SE_PATTERN, level: "normal" as ExamLevel, note: null },
  {
    id: "infosys-se-hard",
    company: "Infosys",
    name: "Systems Engineer (SE) online test · Mock 2 (Hard)",
    short: "Infosys SE 2 Hard",
    pattern: INFOSYS_SE_PATTERN,
    level: "hard" as ExamLevel,
    note: "Hard mode: same pattern and timers, but multi-step questions designed with traps. Expect a lower score than in Mock 1 — that's the point.",
  },
  {
    id: "deloitte-nla",
    company: "Deloitte",
    name: "Cyber Gurukul · Analyst Trainee (NLA)",
    short: "Deloitte NLA",
    pattern: DELOITTE_NLA_PATTERN,
    level: "realistic" as ExamLevel,
    note: "The last section is coding: one short problem and one medium one, 25 minutes, judged on hidden tests. Write C++ or Java here (the real test also allows C and Python). The reported cut-off is 1 of 2.",
  },
  {
    id: "cognizant-genc",
    company: "Cognizant",
    name: "GenC · GenC Pro · GenC Next — Java cluster",
    short: "Cognizant GenC (Java)",
    pattern: COGNIZANT_GENC_PATTERN,
    level: "realistic" as ExamLevel,
    note: "Reported 2025–26 pattern. Aptitude first, then one 120-minute technical round for the Java + SQL cluster: 2 coding problems and 2 SQL queries judged on hidden tests, 20 code-debugging MCQs (Java, C, JavaScript, SQL) and 10 Java/SQL MCQs. The AI communication round and the game-based puzzles are not simulated yet.",
  },
  {
    id: "cognizant-genc-python",
    company: "Cognizant",
    name: "GenC · GenC Pro · GenC Next — Python cluster",
    short: "Cognizant GenC (Python)",
    pattern: COGNIZANT_GENC_PYTHON_PATTERN,
    level: "realistic" as ExamLevel,
    note: "Same aptitude round, then the technical round for the Python + SQL + cloud cluster: 2 coding problems (solve them in Python) and 2 SQL queries judged on hidden tests, 20 code-debugging MCQs (Python, C, JavaScript, SQL) and 10 Python/SQL/cloud MCQs.",
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
  coding: 0.5,
};

/** Auto-submit the mock after this many proctoring violations. */
export const MAX_VIOLATIONS = 3;

/** Grace period for answers that arrive just after a section timer ends (network latency). */
export const SUBMIT_GRACE_MS = 5000;

/**
 * The open test page checks in every HEARTBEAT_MS. No check-in for LEFT_AFTER_MS means the student
 * left, and the test is scored as it stands, but only when that is seen from elsewhere: the dashboard,
 * starting another test, or reopening the test page. A request from the still-open page (a check-in or
 * an answer after the network comes back) never submits it: a network drop is not leaving.
 */
export const HEARTBEAT_MS = 30 * 1000;
export const LEFT_AFTER_MS = 10 * 60 * 1000;
