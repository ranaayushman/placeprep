import { beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { attemptQuestions, attemptSections, db, users } from "@/db";
import { createMock, createPractice, getExamState, recordViolation, saveAnswer, submitSection, getResult } from "@/lib/exam/service";
import { getTopicStats, mockHistory, recommend } from "@/lib/analytics";
import { DELOITTE_NLA_PATTERN, INFOSYS_SE_PATTERN, MAX_VIOLATIONS } from "@/lib/exam/pattern";

let userId: string;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  const [u] = await db.insert(users).values({ email: "t@example.com", name: "Test", passwordHash: "x" }).returning();
  userId = u.id;
});

describe("mock exam", () => {
  it("builds a mock matching the pattern, with one RC passage grouped together", async () => {
    const id = await createMock(userId, { includeWriting: true });
    const { sections, questions } = await getResult(id, userId);
    expect(sections.map((s) => s.section)).toEqual(INFOSYS_SE_PATTERN.map((p) => p.section));
    for (const spec of INFOSYS_SE_PATTERN) {
      expect(questions.filter((q) => q.section === spec.section)).toHaveLength(spec.questions);
    }
    const rc = questions.filter((q) => q.topic === "v-rc");
    expect(rc).toHaveLength(4);
    expect(new Set(rc.map((q) => JSON.parse(q.payload).passage)).size).toBe(1);
    // The payload sent to the browser must never contain the answer.
    for (const q of questions) expect(JSON.parse(q.payload)).not.toHaveProperty("answer");
  });

  it("builds a Deloitte NLA mock: verbal, reasoning, quant and technical, tagged with its exam", async () => {
    const id = await createMock(userId, { exam: "deloitte-nla", includeWriting: true });
    const { attempt, sections, questions } = await getResult(id, userId);
    expect(attempt.exam).toBe("deloitte-nla");
    expect(attempt.title).toBe("Deloitte NLA Mock #1");
    expect(sections.map((s) => [s.section, s.durationSec])).toEqual(DELOITTE_NLA_PATTERN.map((p) => [p.section, p.minutes * 60]));
    for (const spec of DELOITTE_NLA_PATTERN) {
      expect(questions.filter((q) => q.section === spec.section)).toHaveLength(spec.questions);
    }
    expect(questions.filter((q) => q.section === "technical").every((q) => q.topic.startsWith("t-"))).toBe(true);
    // No repeated bank item inside one mock.
    expect(new Set(questions.map((q) => `${q.topic}:${q.ref}`)).size).toBe(questions.length);
    expect(questions.filter((q) => q.topic === "v-rc")).toHaveLength(4);
  });

  it("only exposes the current section, and refuses answers to closed sections", async () => {
    const id = await createMock(userId, { includeWriting: false });
    const s0 = await getExamState(id, userId);
    if (s0.status !== "IN_PROGRESS") throw new Error("expected in progress");
    expect(s0.current.section).toBe("reasoning");
    expect(s0.current.questions).toHaveLength(15);
    expect(s0.current.questions[0].feedback).toBeNull();

    const first = s0.current.questions[0];
    await saveAnswer(id, userId, { questionId: first.id, chosenIndex: 0, timeDeltaMs: 4000 });
    await submitSection(id, userId, 0);

    await expect(saveAnswer(id, userId, { questionId: first.id, chosenIndex: 1 })).rejects.toThrow(/closed/);
    const s1 = await getExamState(id, userId);
    if (s1.status !== "IN_PROGRESS") throw new Error("expected in progress");
    expect(s1.current.section).toBe("math");
  });

  it("auto-advances when the server clock passes the section end", async () => {
    const id = await createMock(userId, { includeWriting: false });
    await getExamState(id, userId); // starts section 0
    // Pretend the reasoning section started 26 minutes ago.
    await db.update(attemptSections).set({ startedAt: new Date(Date.now() - 26 * 60 * 1000) }).where(eq(attemptSections.attemptId, id));
    const s = await getExamState(id, userId);
    if (s.status !== "IN_PROGRESS") throw new Error("expected in progress");
    expect(s.current.order).toBe(1);
  });

  it(`auto-submits after ${MAX_VIOLATIONS} violations`, async () => {
    const id = await createMock(userId, { includeWriting: false });
    await getExamState(id, userId);
    let res;
    for (let i = 0; i < MAX_VIOLATIONS; i++) res = await recordViolation(id, userId, "tab-hidden");
    expect(res!.autoSubmitted).toBe(true);
    expect((await getExamState(id, userId)).status).toBe("SUBMITTED");
  });

  it("grades a full mock and feeds analytics + recommendations", async () => {
    const id = await createMock(userId, { includeWriting: false });
    for (let order = 0; order < 5; order++) {
      const s = await getExamState(id, userId);
      if (s.status !== "IN_PROGRESS") throw new Error("ended early");
      const rows = await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, id));
      for (const q of s.current.questions) {
        const truth = rows.find((r) => r.id === q.id)!;
        // Answer reasoning perfectly, everything else wrong.
        const pick = order === 0 ? truth.answerIndex : (truth.answerIndex + 1) % q.view.options.length;
        await saveAnswer(id, userId, { questionId: q.id, chosenIndex: pick, timeDeltaMs: 30_000 });
      }
      await submitSection(id, userId, order);
    }
    const { attempt } = await getResult(id, userId);
    expect(attempt.status).toBe("SUBMITTED");
    expect(attempt.score).toBe(15);
    expect(attempt.maxScore).toBe(54);

    const stats = await getTopicStats(userId);
    const history = await mockHistory(userId);
    expect(history.at(-1)!.bySection.reasoning).toEqual({ correct: 15, total: 15 });
    const recs = recommend(stats, history, 39);
    const sectionRecs = recs.filter((r) => r.kind === "section");
    expect(sectionRecs).toHaveLength(2); // only the two biggest gaps
    expect(sectionRecs[0].title).toMatch(/^Verbal/); // 0% vs the highest target (65%)
    expect(sectionRecs[0].topicIds!.every((t) => t.startsWith("v-"))).toBe(true);
    expect(recs.find((r) => r.kind === "topic")!.topicId).not.toMatch(/^r-/);
  });
});

describe("practice", () => {
  it("reveals feedback immediately and locks the answer", async () => {
    const id = await createPractice(userId, { topicIds: ["m-percent", "p-bitwise"], count: 4, timed: false });
    const s = await getExamState(id, userId);
    if (s.status !== "IN_PROGRESS") throw new Error();
    expect(s.current.questions).toHaveLength(4);
    const q = s.current.questions[0];
    const res = await saveAnswer(id, userId, { questionId: q.id, chosenIndex: 0 });
    expect(res.feedback).not.toBeNull();
    await expect(saveAnswer(id, userId, { questionId: q.id, chosenIndex: 1 })).rejects.toThrow(/locked/);
    // Mixed practice stores each question under its own section.
    const rows = await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, id));
    expect(new Set(rows.map((r) => r.section))).toEqual(new Set(["math", "pseudocode"]));
  });

  it("a double-tap on Start opens one quiz, not two", async () => {
    const opts = { topicIds: ["t-dbms"], count: 5, timed: false };
    const [a, b] = await Promise.all([createPractice(userId, opts), createPractice(userId, opts)]);
    expect(a).toBe(b);
    // Once the student has answered something, starting the same quiz again gives a fresh one.
    const s = await getExamState(a, userId);
    if (s.status !== "IN_PROGRESS") throw new Error();
    await saveAnswer(a, userId, { questionId: s.current.questions[0].id, chosenIndex: 0 });
    expect(await createPractice(userId, opts)).not.toBe(a);
  });

  it("avoids repeating finite-bank items until the bank is exhausted", async () => {
    const id = await createPractice(userId, { topicIds: ["r-ds"], count: 10, timed: false });
    const rows = await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, id));
    const items = rows.map((r) => Number(r.ref.split(":")[1]) % 10);
    expect(new Set(items).size).toBe(10);
  });
});

vi.setConfig({ testTimeout: 30_000 });

describe("admin queries", () => {
  it("flags users with many violations and lists them with aggregates", async () => {
    const { adminOverview, listUsers, userDetail, flaggedUsers } = await import("@/lib/admin");
    const flagged = await flaggedUsers();
    // The auto-submit test above produced 3 violations for this user.
    expect(flagged.some((f) => f.id === userId && f.v7d >= 3)).toBe(true);

    const list = await listUsers({ q: "t@example", filter: "flagged", page: 1 });
    expect(list.total).toBe(1);
    expect(list.rows[0].mocks).toBeGreaterThan(0);
    expect(list.rows[0].violations).toBeGreaterThanOrEqual(3);

    const detail = await userDetail(userId);
    expect(detail!.events.filter((e) => e.type === "violation").length).toBeGreaterThanOrEqual(3);
    expect(detail!.events.some((e) => e.type === "mock_submitted")).toBe(true);

    const overview = await adminOverview();
    expect(overview.counts.students).toBeGreaterThan(0);
  });
});

describe("rate limiter", () => {
  it("blocks after the limit within the window", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) expect((await rateLimit(key, 3, 60_000)).ok).toBe(true);
    expect(await rateLimit(key, 3, 60_000)).toMatchObject({ ok: false });
  });

  it("starts a fresh window once the old one is over", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `test:${Math.random()}`;
    expect((await rateLimit(key, 1, 50)).ok).toBe(true);
    expect((await rateLimit(key, 1, 50)).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect((await rateLimit(key, 1, 50)).ok).toBe(true);
  });
});

it("a mock started with camera proctoring off is saved and reported as camera off", async () => {
  const [u] = await db.insert(users).values({ email: "cam@example.com", name: "Cam", passwordHash: "x" }).returning();
  const id = await createMock(u.id, { includeWriting: false, cameraOff: true });
  const state = await getExamState(id, u.id);
  expect(state.status === "IN_PROGRESS" && state.cameraOff).toBe(true);
  expect((await getResult(id, u.id)).attempt.cameraOff).toBe(true);
});

it("camera alerts are counted separately and never auto-submit the mock", async () => {
  const [u] = await db.insert(users).values({ email: "alerts@example.com", name: "Alerts", passwordHash: "x" }).returning();
  const id = await createMock(u.id, { includeWriting: false });
  let res;
  for (let i = 0; i < MAX_VIOLATIONS + 2; i++) res = await recordViolation(id, u.id, "no-face");
  expect(res).toEqual({ violations: 0, cameraAlerts: MAX_VIOLATIONS + 2, autoSubmitted: false });
  const state = await getExamState(id, u.id);
  expect(state.status === "IN_PROGRESS" && state.cameraAlerts).toBe(MAX_VIOLATIONS + 2);
});
