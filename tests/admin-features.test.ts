import { beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { and, eq } from "drizzle-orm";
import { appErrors, attemptQuestions, attempts, bankReports, db, deletionRequests, sessions, users } from "@/db";
import { hashToken } from "@/lib/auth";

const jar = { token: "" };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "sid" && jar.token ? { value: jar.token } : undefined), set() {}, delete() {} }),
  headers: async () => new Headers({ "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` }),
}));
vi.mock("next/cache", () => ({ revalidatePath() {}, revalidateTag() {}, unstable_cache: <T>(fn: T) => fn }));

const { reportAction } = await import("@/app/(app)/community/actions");
const { openBankReports, closeBankReports } = await import("@/lib/bank-reports");
const { createPractice, createMock, getExamState, saveAnswer } = await import("@/lib/exam/service");
const { signupFunnel, retentionCohorts } = await import("@/lib/admin");
const { requestDeletionAction, cancelDeletionAction } = await import("@/app/(app)/account/actions");
const { pendingDeletions } = await import("@/lib/deletion-requests");
const { POST: postError } = await import("@/app/api/errors/route");
const { errorGroups } = await import("@/lib/app-errors");

async function sessionFor(role: "STUDENT" | "ADMIN" = "STUDENT", extra: Partial<typeof users.$inferInsert> = {}) {
  const [u] = await db.insert(users).values({ email: `af-${Math.random()}@example.com`, name: "Af User", passwordHash: "x", role, onboardedAt: new Date(), ...extra }).returning();
  const token = `t-${Math.random()}`;
  await db.insert(sessions).values({ userId: u.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3_600_000) });
  return { id: u.id, token };
}
const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
});

describe("reporting built-in questions", () => {
  it("works once the answer is shown, once per student, and lands in the admin queue", async () => {
    const s = await sessionFor();
    jar.token = s.token;
    const id = await createPractice(s.id, { topicIds: ["z-crypt"], count: 3, timed: false });
    const st = await getExamState(id, s.id);
    if (st.status !== "IN_PROGRESS") throw new Error("expected in progress");
    const q = st.current.questions[0];
    // Not answered yet: the answer isn't shown, so no report.
    expect(await reportAction(undefined, form({ attemptQuestionId: q.id, reason: "WRONG_ANSWER" }))).toMatchObject({ error: /once its answer is shown/ });
    await saveAnswer(id, s.id, { questionId: q.id, chosenIndex: 0 });
    expect(await reportAction(undefined, form({ attemptQuestionId: q.id, reason: "WRONG_ANSWER", details: "B is right" }))).toEqual({ ok: true });
    expect(await reportAction(undefined, form({ attemptQuestionId: q.id, reason: "WRONG_ANSWER" }))).toEqual({ ok: true }); // counted once

    const [row] = await db.select().from(attemptQuestions).where(eq(attemptQuestions.id, q.id));
    const group = (await openBankReports()).find((g) => g.ref === row.ref)!;
    expect(group).toMatchObject({ open: 1, topic: "z-crypt", details: ["B is right"] });
    expect(group.question?.options.length).toBeGreaterThan(1);

    // Another student can't report a question from someone else's attempt.
    jar.token = (await sessionFor()).token;
    expect(await reportAction(undefined, form({ attemptQuestionId: q.id, reason: "UNCLEAR" }))).toMatchObject({ error: /not found/ });

    expect(await closeBankReports(s.id, row.ref, "RESOLVED")).toBe(1);
    expect((await openBankReports()).find((g) => g.ref === row.ref)).toBeUndefined();
  });

  it("can't be used mid-mock to fish for answers", async () => {
    const s = await sessionFor();
    jar.token = s.token;
    const id = await createMock(s.id, { includeWriting: false });
    const st = await getExamState(id, s.id);
    if (st.status !== "IN_PROGRESS") throw new Error("expected in progress");
    await saveAnswer(id, s.id, { questionId: st.current.questions[0].id, chosenIndex: 0 });
    expect(await reportAction(undefined, form({ attemptQuestionId: st.current.questions[0].id, reason: "WRONG_ANSWER" }))).toMatchObject({ error: /answer is shown/ });
    expect(await db.select().from(bankReports).where(eq(bankReports.userId, s.id))).toHaveLength(0);
  });
});

describe("growth", () => {
  it("funnel counts each step and never goes up", async () => {
    const t0 = Date.now();
    const DAY = 86_400_000;
    const before = (await signupFunnel(t0 - 60_000)).map((s) => s.n);
    const a = await sessionFor("STUDENT", { onboardedAt: null });
    const b = await sessionFor();
    const c = await sessionFor("STUDENT", { lastSeenAt: new Date(t0 + 2 * DAY) });
    await db.insert(attempts).values({ userId: b.id, mode: "PRACTICE", title: "p", status: "IN_PROGRESS" });
    await db.insert(attempts).values({ userId: c.id, mode: "MOCK", title: "m", status: "SUBMITTED", score: 5, maxScore: 10 });
    await sessionFor("ADMIN"); // not counted
    await db.insert(attempts).values({ userId: a.id, mode: "MOCK", title: "m", status: "SUBMITTED", score: 1, maxScore: 2 }); // not onboarded: stops at step 1
    const after = (await signupFunnel(t0 - 60_000)).map((s) => s.n);
    expect(after.map((n, i) => n - before[i])).toEqual([3, 2, 2, 1, 1, 1]);
    for (let i = 1; i < 5; i++) expect(after[i]).toBeLessThanOrEqual(after[i - 1]);
  });

  it("cohorts count students active in a later week, and leave unfinished weeks blank", async () => {
    const WEEK = 7 * 86_400_000;
    const created = new Date(Date.now() - 3 * WEEK - 1000);
    const s = await sessionFor("STUDENT", { createdAt: created } as never);
    await db.insert(attempts).values({ userId: s.id, mode: "PRACTICE", title: "w1", status: "SUBMITTED", startedAt: new Date(created.getTime() + WEEK + 1000) });
    const cohort = (await retentionCohorts()).find((c) => c.weekStart.getTime() <= created.getTime() && created.getTime() < c.weekStart.getTime() + WEEK)!;
    expect(cohort.size).toBeGreaterThanOrEqual(1);
    expect(cohort.weeks[0]).toBeGreaterThanOrEqual(1);
    expect(cohort.weeks[3]).toBeNull(); // week 4 isn't over yet
  });
});

describe("deletion requests", () => {
  it("a student can request and cancel; the request goes when the account is deleted", async () => {
    const s = await sessionFor();
    jar.token = s.token;
    expect(await requestDeletionAction(undefined, form({ reason: "done with placements" }))).toMatchObject({ error: /Tick the box/ });
    expect(await requestDeletionAction(undefined, form({ reason: "done with placements", confirm: "on" }))).toBeUndefined();
    expect((await pendingDeletions()).find((r) => r.userId === s.id)).toMatchObject({ reason: "done with placements" });
    await cancelDeletionAction();
    expect(await db.select().from(deletionRequests).where(eq(deletionRequests.userId, s.id))).toHaveLength(0);

    await requestDeletionAction(undefined, form({ confirm: "on" }));
    await db.delete(users).where(eq(users.id, s.id));
    expect(await db.select().from(deletionRequests).where(eq(deletionRequests.userId, s.id))).toHaveLength(0);
  });

  it("admins can't request it for themselves", async () => {
    jar.token = (await sessionFor("ADMIN")).token;
    expect(await requestDeletionAction(undefined, form({ confirm: "on" }))).toMatchObject({ error: /Admins/ });
  });
});

describe("error tracking", () => {
  it("records browser errors, groups repeats, and rejects junk", async () => {
    const s = await sessionFor();
    jar.token = s.token;
    const msg = `TypeError: x is undefined ${Math.random()}`;
    const send = (body: unknown) => postError(new Request("http://x/api/errors", { method: "POST", body: JSON.stringify(body) }));
    expect((await send({ message: msg, path: "/onboarding", digest: "123" })).status).toBe(204);
    expect((await send({ message: msg, path: "/onboarding" })).status).toBe(204);
    expect((await send({ nope: true })).status).toBe(400);
    const g = (await errorGroups()).find((e) => e.message === msg)!;
    expect(g).toMatchObject({ source: "client", count: 2, users: 1, path: "/onboarding" });
    expect(await db.select().from(appErrors).where(and(eq(appErrors.message, msg), eq(appErrors.userId, s.id)))).toHaveLength(2);
  });
});
