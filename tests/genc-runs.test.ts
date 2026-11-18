import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { attemptQuestions, attempts, db, users } from "@/db";
import { getResult, submitAll, createMock } from "@/lib/exam/service";
import { getExam, isLegacyExam, isPaperExam, listExams, listExamsFor, canTakeExam } from "@/lib/exam/exams";
import { GENC_VARIANTS, getRun, listRuns, startPaper, startRun } from "@/lib/exam/runs";
import { COGNIZANT_GENC_PATTERN, COGNIZANT_GENC_PYTHON_PATTERN, PAPER_EXAMS } from "@/lib/exam/pattern";

let a: string;
let b: string;
const opts = { includeWriting: false, cameraOff: true };

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  [{ id: a }, { id: b }] = await db
    .insert(users)
    .values([
      { email: "genc-a@example.com", name: "A", passwordHash: "x" },
      { email: "genc-b@example.com", name: "B", passwordHash: "x" },
    ])
    .returning({ id: users.id });
});

/** Answers the first `n` MCQs correctly, then submits the whole paper. */
async function finish(attemptId: string, userId: string, n: number) {
  const qs = await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, attemptId));
  for (const q of qs.filter((x) => x.answerIndex >= 0).slice(0, n)) {
    await db.update(attemptQuestions).set({ chosenIndex: q.answerIndex }).where(eq(attemptQuestions.id, q.id));
  }
  await submitAll(attemptId, userId);
  return getResult(attemptId, userId);
}

describe("GenC papers", () => {
  it("split the one-sitting GenC mock into Communication, Aptitude and Coding without losing a question or a minute", () => {
    const total = (p: { questions: number; minutes: number }[]) => [p.reduce((x, s) => x + s.questions, 0), p.reduce((x, s) => x + s.minutes, 0)];
    for (const [coding, full] of [["genc-coding-java", COGNIZANT_GENC_PATTERN], ["genc-coding-python", COGNIZANT_GENC_PYTHON_PATTERN]] as const) {
      const papers = PAPER_EXAMS.filter((p) => p.id === "genc-communication" || p.id === "genc-aptitude" || p.id === coding);
      // The optional essay is extra (ungraded), so leave it out of the comparison.
      const parts = papers.flatMap((p) => p.pattern).filter((s) => s.section !== "writing");
      expect(total(parts)).toEqual(total(full));
    }
  });

  it("are takeable by id but never listed as exams", async () => {
    for (const p of PAPER_EXAMS) {
      expect(isPaperExam(p.id)).toBe(true);
      expect((await getExam(p.id))?.id).toBe(p.id);
      expect(await canTakeExam("x@example.com", p.id)).toBeDefined();
    }
    const ids = (await listExams()).map((e) => e.id);
    const forStudent = (await listExamsFor("x@example.com")).map((e) => e.id);
    for (const p of PAPER_EXAMS) {
      expect(ids).not.toContain(p.id);
      expect(forStudent).not.toContain(p.id);
    }
  });
});

describe("old one-sitting GenC mocks", () => {
  const OLD = ["cognizant-genc", "cognizant-genc-python", "cognizant-genc-hard", "cognizant-genc-python-hard"];
  it("are no longer offered to students, but still resolve so old attempts and results keep working", async () => {
    const offered = (await listExamsFor("x@example.com")).map((e) => e.id);
    for (const id of OLD) {
      expect(isLegacyExam(id)).toBe(true);
      expect(offered).not.toContain(id);
      expect((await getExam(id))?.id).toBe(id);
    }
    expect(offered).toEqual(expect.arrayContaining(["infosys-se", "infosys-se-hard", "deloitte-nla"]));
    expect(isLegacyExam("infosys-se")).toBe(false);
  });
});

describe("GenC drive", () => {
  it("lets papers be taken separately, in any order, and shows the combined score only when all three are in", async () => {
    const runId = await startRun(a, "java");
    let run = (await getRun(a, runId))!;
    expect(run.papers.map((p) => p.def.title)).toEqual(["Communication", "Aptitude", "Coding"]);
    expect(run.done).toBe(0);
    expect(run.combined).toBeNull();

    // Aptitude first, then Communication "the next day", Coding last.
    const aptitude = await startPaper(a, runId, "genc-aptitude", opts);
    expect((await getResult(aptitude, a)).attempt.runId).toBe(runId);
    const apt = await finish(aptitude, a, 5);
    run = (await getRun(a, runId))!;
    expect(run.done).toBe(1);
    expect(run.combined).toBeNull();
    expect(run.papers[1].attempt?.score).toBe(apt.attempt.score);

    const comm = await finish(await startPaper(a, runId, "genc-communication", opts), a, 3);
    run = (await getRun(a, runId))!;
    expect(run.done).toBe(2);
    expect(run.combined).toBeNull(); // still waiting on Coding

    const code = await finish(await startPaper(a, runId, "genc-coding-java", opts), a, 4);
    run = (await getRun(a, runId))!;
    expect(run.complete).toBe(true);
    expect(run.combined).toEqual({
      score: (apt.attempt.score ?? 0) + (comm.attempt.score ?? 0) + (code.attempt.score ?? 0),
      maxScore: (apt.attempt.maxScore ?? 0) + (comm.attempt.maxScore ?? 0) + (code.attempt.maxScore ?? 0),
    });
    expect(run.combined!.maxScore).toBeGreaterThan(0);
    // Each paper keeps its own score.
    expect(run.papers.map((p) => p.attempt?.score)).toEqual([comm.attempt.score, apt.attempt.score, code.attempt.score]);
  });

  it("uses the cluster's own Coding paper", async () => {
    const runId = await startRun(b, "python");
    const run = (await getRun(b, runId))!;
    expect(run.papers[2].def.examId).toBe("genc-coding-python");
    await expect(startPaper(b, runId, "genc-coding-java", opts)).rejects.toThrow("isn't part of this drive");
  });

  it("starts each paper once: resumes one that is open, refuses one already submitted, survives a double click", async () => {
    const runId = await startRun(b, "python"); // same unfinished drive, not a second one
    expect((await listRuns(b)).filter((r) => r.variant === "python")).toHaveLength(1);

    const [x, y] = await Promise.all([startPaper(b, runId, "genc-aptitude", opts), startPaper(b, runId, "genc-aptitude", opts)]);
    expect(x).toBe(y);
    expect(await db.select().from(attempts).where(eq(attempts.runId, runId))).toHaveLength(1);
    expect(await startPaper(b, runId, "genc-aptitude", opts)).toBe(x); // still open: resumed

    await finish(x, b, 2);
    await expect(startPaper(b, runId, "genc-aptitude", opts)).rejects.toThrow("already taken this paper");
  });

  it("starts a fresh drive once the old one is complete, and keeps drives private to their owner", async () => {
    const first = (await listRuns(a))[0];
    expect(first.complete).toBe(true);
    const second = await startRun(a, "java");
    expect(second).not.toBe(first.id);
    expect((await getRun(a, second))!.done).toBe(0);

    expect(await getRun(b, first.id)).toBeNull();
    await expect(startPaper(b, first.id, "genc-aptitude", opts)).rejects.toThrow("Unknown GenC drive");
  });

  it("rejects an unknown cluster, and papers taken outside a drive don't count toward any drive", async () => {
    await expect(startRun(a, "cobol")).rejects.toThrow("Choose Java or Python");
    const loose = await createMock(a, { exam: "genc-aptitude", includeWriting: false });
    expect((await getResult(loose, a)).attempt.runId).toBeNull();
    expect(Object.keys(GENC_VARIANTS)).toEqual(["java", "python"]);
  });
});

describe("GenC difficulty", () => {
  let c: string;
  const mk = async (extra: Partial<typeof users.$inferInsert> = {}) => {
    const [u] = await db.insert(users).values({ email: `d-${Math.random()}@example.com`, name: "D", passwordHash: "x", ...extra }).returning();
    return u.id;
  };
  beforeAll(async () => {
    c = await mk();
  });

  it("keeps Extreme locked until 2 friends have joined, and the browser can't skip the check", async () => {
    await expect(startRun(c, "java", "extreme")).rejects.toThrow("Extreme unlocks");
    await mk({ referredBy: c, onboardedAt: new Date() });
    await expect(startRun(c, "java", "extreme")).rejects.toThrow("Extreme unlocks"); // 1 of 2
    await mk({ referredBy: c, onboardedAt: new Date() });
    expect((await getRun(c, await startRun(c, "java", "extreme")))!.difficulty).toBe("extreme");
  });

  it("opens Extreme for an admin account, or for a student an admin has unlocked, with no referrals", async () => {
    await expect(startRun(await mk(), "python", "extreme")).rejects.toThrow("Extreme unlocks");
    expect(await startRun(await mk({ role: "ADMIN" }), "python", "extreme")).toBeTruthy();
    expect(await startRun(await mk({ inviteUnlockedAt: new Date() }), "python", "extreme")).toBeTruthy();
  });

  it("rejects an unknown difficulty and defaults to Standard", async () => {
    await expect(startRun(a, "java", "impossible")).rejects.toThrow("Choose a difficulty");
    expect((await getRun(a, await startRun(a, "java")))!.difficulty).toBe("standard");
  });

  it("keeps a Standard and an Extreme drive of the same cluster separate", async () => {
    const admin = await mk({ role: "ADMIN" });
    const std = await startRun(admin, "java", "standard");
    const ext = await startRun(admin, "java", "extreme");
    expect(ext).not.toBe(std);
    expect(await startRun(admin, "java", "extreme")).toBe(ext); // same difficulty, still open: reused
  });

  it("never hands back an open paper from a different drive", async () => {
    const admin = await mk({ role: "ADMIN" });
    const inStd = await startPaper(admin, await startRun(admin, "python", "standard"), "genc-communication", opts);
    const inExt = await startPaper(admin, await startRun(admin, "python", "extreme"), "genc-communication", opts);
    expect(inExt).not.toBe(inStd);
    expect((await getResult(inExt, admin)).attempt.runId).not.toBe((await getResult(inStd, admin)).attempt.runId);
  });

  it("serves only hard-tier questions in an Extreme paper, and labels it", async () => {
    const admin = await mk({ role: "ADMIN" });
    const std = await getResult(await startPaper(admin, await startRun(admin, "java", "standard"), "genc-aptitude", opts), admin);
    const ext = await getResult(await startPaper(admin, await startRun(admin, "java", "extreme"), "genc-aptitude", opts), admin);
    const { TOPIC_BY_ID } = await import("@/lib/questions");
    // Extreme: every question whose topic has a hard tier comes from it. Standard mixes (70-80%), so it has standard ones too.
    const eligible = (qs: typeof ext.questions) => qs.filter((q) => TOPIC_BY_ID.get(q.topic)?.hard);
    expect(eligible(ext.questions).length).toBeGreaterThan(0);
    expect(eligible(ext.questions).every((q) => q.ref.endsWith(":h"))).toBe(true);
    expect(eligible(std.questions).some((q) => !q.ref.endsWith(":h"))).toBe(true);
    expect(ext.attempt.title).toContain("(Extreme)");
    expect(std.attempt.title).not.toContain("Extreme");
  });
});
