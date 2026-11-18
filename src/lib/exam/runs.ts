import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { attempts, db, examRuns, type Attempt } from "@/db";
import { referralLock } from "@/lib/referral";
import { getExam, type Exam } from "./exams";
import type { ExamLevel } from "./pattern";
import { createMock, ExamError } from "./service";

/**
 * Multi-paper exams. Cognizant GenC is three separate papers (Communication, Aptitude, Coding) that a student
 * takes whenever they like. A "run" groups the three attempts; once all are submitted the combined score is
 * shown next to each paper's own. Each paper is an ordinary MOCK attempt (see PAPER_EXAMS in pattern.ts).
 */
export const GENC_SERIES = "genc";

export type PaperSlug = "communication" | "aptitude" | "coding";
export type PaperDef = { slug: PaperSlug; examId: string; title: string; blurb: string };

const COMMUNICATION: PaperDef = { slug: "communication", examId: "genc-communication", title: "Communication", blurb: "English and verbal ability: reading comprehension, grammar and vocabulary, plus an optional essay." };
const APTITUDE: PaperDef = { slug: "aptitude", examId: "genc-aptitude", title: "Aptitude", blurb: "Quantitative ability, logical reasoning and the game-based rounds." };
const coding = (examId: string, cluster: string): PaperDef => ({ slug: "coding", examId, title: "Coding", blurb: `The technical round for the ${cluster} cluster: coding problems, SQL queries, code debugging and tech MCQs.` });

export const GENC_VARIANTS = {
  java: { label: "Java + SQL + web", papers: [COMMUNICATION, APTITUDE, coding("genc-coding-java", "Java + SQL + web")] },
  python: { label: "Python + SQL + cloud", papers: [COMMUNICATION, APTITUDE, coding("genc-coding-python", "Python + SQL + cloud")] },
} as const;
export type GencVariant = keyof typeof GENC_VARIANTS;
export const isGencVariant = (v: string): v is GencVariant => v in GENC_VARIANTS;

/** Standard is the hard-tier mix the old GenC mock used; Extreme draws every MCQ from the hard tier and unlocks with invites. */
export const GENC_DIFFICULTIES = {
  standard: { label: "Standard", level: "hard" as ExamLevel, blurb: "Pitched 1.5–2× harder than the real paper, so the real one feels easy." },
  extreme: { label: "Extreme", level: "max" as ExamLevel, blurb: "Every aptitude, game, verbal and technical MCQ comes from the hard tier: multi-step, trap options, bigger grids and mazes." },
} as const;
export type GencDifficulty = keyof typeof GENC_DIFFICULTIES;
export const isGencDifficulty = (v: string): v is GencDifficulty => v in GENC_DIFFICULTIES;
/** The referral-lock key for Extreme (REFERRALS_TO_UNLOCK in lib/referral.ts). */
export const EXTREME_LOCK_KEY = "genc-extreme";

export type RunPaper = { def: PaperDef; exam: Exam; attempt: Attempt | null };
export type RunView = {
  id: string;
  variant: GencVariant;
  difficulty: GencDifficulty;
  createdAt: Date;
  papers: RunPaper[];
  done: number;
  complete: boolean;
  /** Present only once every paper is submitted: the sum over the three papers. */
  combined: { score: number; maxScore: number } | null;
};

async function build(run: typeof examRuns.$inferSelect, rows: Attempt[]): Promise<RunView> {
  const variant = run.variant as GencVariant;
  const papers: RunPaper[] = [];
  for (const def of GENC_VARIANTS[variant].papers) {
    const exam = await getExam(def.examId);
    if (!exam) throw new ExamError("Unknown exam");
    papers.push({ def, exam, attempt: rows.find((a) => a.exam === def.examId) ?? null });
  }
  const finished = papers.filter((p) => p.attempt?.status === "SUBMITTED");
  const complete = finished.length === papers.length;
  return {
    id: run.id,
    variant,
    difficulty: isGencDifficulty(run.difficulty) ? run.difficulty : "standard",
    createdAt: run.createdAt,
    papers,
    done: finished.length,
    complete,
    combined: complete ? { score: finished.reduce((a, p) => a + (p.attempt!.score ?? 0), 0), maxScore: finished.reduce((a, p) => a + (p.attempt!.maxScore ?? 0), 0) } : null,
  };
}

/** One of this student's runs, or null when it doesn't exist or isn't theirs. */
export async function getRun(userId: string, runId: string): Promise<RunView | null> {
  const [run] = await db.select().from(examRuns).where(and(eq(examRuns.id, runId), eq(examRuns.userId, userId)));
  if (!run) return null;
  return build(run, await db.select().from(attempts).where(eq(attempts.runId, runId)));
}

/** This student's GenC runs, newest first. */
export async function listRuns(userId: string): Promise<RunView[]> {
  const runs = await db.select().from(examRuns).where(and(eq(examRuns.userId, userId), eq(examRuns.series, GENC_SERIES))).orderBy(desc(examRuns.createdAt));
  if (!runs.length) return [];
  const rows = await db.select().from(attempts).where(inArray(attempts.runId, runs.map((r) => r.id)));
  return Promise.all(runs.map((r) => build(r, rows.filter((a) => a.runId === r.id))));
}

/**
 * Starts a GenC drive at a difficulty. Extreme needs the invite unlock (2 friends, or an admin unlock, or an
 * admin account), checked here so it can't be skipped from the browser. If the student already has a drive of
 * this cluster and difficulty with papers left, that one is returned (a double click or a refresh must not create
 * a second one); a finished drive makes room for a new one.
 */
export async function startRun(userId: string, variant: string, difficulty: string = "standard"): Promise<string> {
  if (!isGencVariant(variant)) throw new ExamError("Choose Java or Python");
  if (!isGencDifficulty(difficulty)) throw new ExamError("Choose a difficulty");
  if (difficulty === "extreme" && (await referralLock(userId, EXTREME_LOCK_KEY))) throw new ExamError("Extreme unlocks after friends join through your invite link.");
  const open = (await listRuns(userId)).find((r) => r.variant === variant && r.difficulty === difficulty && !r.complete);
  if (open) return open.id;
  const [run] = await db.insert(examRuns).values({ userId, series: GENC_SERIES, variant, difficulty }).returning({ id: examRuns.id });
  return run.id;
}

/**
 * Starts one paper of a run and returns the attempt id. A paper open in this run is resumed; a submitted one
 * cannot be taken again in the same run (start a new drive to retake).
 */
export async function startPaper(userId: string, runId: string, examId: string, opts: { includeWriting: boolean; cameraOff: boolean }): Promise<string> {
  const run = await getRun(userId, runId);
  if (!run) throw new ExamError("Unknown GenC drive");
  const paper = run.papers.find((p) => p.def.examId === examId);
  if (!paper) throw new ExamError("That paper isn't part of this drive");
  if (paper.attempt) {
    if (paper.attempt.status === "IN_PROGRESS") return paper.attempt.id;
    throw new ExamError("You've already taken this paper in this drive. Start a new drive to retake it.");
  }
  try {
    return await createMock(userId, { exam: examId, runId, level: GENC_DIFFICULTIES[run.difficulty].level, ...opts });
  } catch (e) {
    // Two starts raced: the unique (run, paper) index let only one through, so use that attempt.
    if ((e as { code?: string; cause?: { code?: string } }).code === "23505" || (e as { cause?: { code?: string } }).cause?.code === "23505") {
      const [existing] = await db.select({ id: attempts.id }).from(attempts).where(and(eq(attempts.runId, runId), eq(attempts.exam, examId)));
      if (existing) return existing.id;
    }
    throw e;
  }
}
