import { beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { attemptQuestions, attempts, communityQuestions, db, sessions, users } from "@/db";
import { hashToken } from "@/lib/auth";

const jar = { token: "" };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "sid" && jar.token ? { value: jar.token } : undefined), set() {}, delete() {} }),
  headers: async () => new Headers(),
}));
vi.mock("next/cache", () => ({ revalidatePath() {}, revalidateTag() {}, unstable_cache: <T>(fn: T) => fn }));

const { approveAction } = await import("@/app/admin/community/actions");
const { setRole, blockUser } = await import("@/app/admin/actions");
const { submitAction } = await import("@/app/(app)/community/actions");

async function sessionFor(role: "STUDENT" | "MODERATOR" | "ADMIN") {
  const [u] = await db.insert(users).values({ email: `${role}-${Math.random()}@example.com`, name: `${role} User`, passwordHash: "x", role, onboardedAt: new Date() }).returning();
  const token = `t-${Math.random()}`;
  await db.insert(sessions).values({ userId: u.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3_600_000) });
  return { id: u.id, token };
}
const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const redirectTo = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return String((e as { digest?: string }).digest ?? e);
  }
  throw new Error("expected a redirect");
};
const status = async (id: string) => (await db.select().from(communityQuestions).where(eq(communityQuestions.id, id)))[0]?.status;
const pending = async (authorId: string) =>
  (
    await db
      .insert(communityQuestions)
      .values({ authorId, section: "technical", topic: "t-os", company: "Infosys", stem: `Which scheduler gives every process a fixed time slice? ${Math.random()}`, options: ["Round Robin", "FCFS", "SJF", "Priority"], answerIndex: 0, explanation: "Round Robin cycles with a fixed quantum.", sourceType: "ORIGINAL", status: "PENDING_REVIEW", normStem: `x${Math.random()}`, normOptions: "x" })
      .returning()
  )[0].id;

let mod: { id: string; token: string };
beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  mod = await sessionFor("MODERATOR");
});

describe("moderator", () => {
  it("can add a question without the student practice requirement", async () => {
    jar.token = mod.token;
    const f = form({
      section: "technical", topic: "t-dbms", company: "Infosys", stem: "Which SQL clause filters groups after GROUP BY has run?",
      option0: "WHERE", option1: "HAVING", option2: "ORDER BY", option3: "LIMIT", answer: "1",
      explanation: "HAVING filters groups; WHERE filters rows before grouping.", sourceType: "ORIGINAL", ownWords: "on",
    });
    expect(await redirectTo(submitAction(undefined, f))).toMatch(/\/community\?submitted=/);
    expect(await db.select().from(communityQuestions).where(eq(communityQuestions.authorId, mod.id))).toHaveLength(1);
  });

  it("can publish someone else's question, but not their own", async () => {
    jar.token = mod.token;
    const theirs = await pending((await sessionFor("STUDENT")).id);
    await redirectTo(approveAction(form({ id: theirs })));
    expect(await status(theirs)).toBe("PUBLISHED");

    const own = await pending(mod.id);
    expect(decodeURIComponent(await redirectTo(approveAction(form({ id: own }))))).toMatch(/another reviewer/);
    expect(await status(own)).toBe("PENDING_REVIEW");
  });

  it("gets a 404 on admin-only actions (users, roles)", async () => {
    jar.token = mod.token;
    const student = await sessionFor("STUDENT");
    await expect(setRole(form({ userId: mod.id, role: "ADMIN" }))).rejects.toThrow(/404|NOT_FOUND/);
    await expect(blockUser(form({ userId: student.id, reason: "testing" }))).rejects.toThrow(/404|NOT_FOUND/);
    expect((await db.select().from(users).where(eq(users.id, mod.id)))[0].role).toBe("MODERATOR");
  });

  it("their home page counts their own work (after the tests above: 1 reviewed, 2 added)", async () => {
    const { moderatorStats } = await import("@/lib/community/service");
    const s = await moderatorStats(mod.id);
    expect(s.reviewed).toEqual({ total: 1, week: 1 });
    expect(Object.values(s.mine).reduce((a, n) => a + (n ?? 0), 0)).toBe(2);
    expect(s.queue.PUBLISHED).toBeGreaterThanOrEqual(1);
    expect(s.publishedBySection.find((r) => r.section === "technical")?.n).toBeGreaterThanOrEqual(1);
  });

  it("an admin can make someone a moderator and back", async () => {
    jar.token = (await sessionFor("ADMIN")).token;
    const s = await sessionFor("STUDENT");
    await redirectTo(setRole(form({ userId: s.id, role: "MODERATOR" })));
    expect((await db.select().from(users).where(eq(users.id, s.id)))[0].role).toBe("MODERATOR");
    await redirectTo(setRole(form({ userId: s.id, role: "STUDENT" })));
    expect((await db.select().from(users).where(eq(users.id, s.id)))[0].role).toBe("STUDENT");
  });
});

describe("student numbers for moderators", () => {
  async function answers(topic: string, ref: (i: number) => string, n: number, correct: number) {
    const [u] = await db.insert(users).values({ email: `st-${Math.random()}@example.com`, name: "St", passwordHash: "x" }).returning();
    const [a] = await db.insert(attempts).values({ userId: u.id, mode: "PRACTICE", title: "t", status: "SUBMITTED" }).returning();
    await db.insert(attemptQuestions).values(
      Array.from({ length: n }, (_, i) => ({
        attemptId: a.id, sectionOrder: 0, order: i, section: "technical", topic, ref: ref(i), payload: "{}",
        answerIndex: 0, explanation: "", chosenIndex: i < correct ? 0 : 1, answeredAt: new Date(),
      })),
    );
  }

  it("shows only topics and questions with enough answers, as totals", async () => {
    const { studentQuestionStats, MIN_ANSWERS_FOR_STATS: MIN } = await import("@/lib/community/service");
    await answers("zz-few", (i) => `zz-few:${i}`, MIN - 1, 0);
    await answers("zz-hard", (i) => `zz-hard:${i}`, MIN, MIN / 4);
    const qid = await pending(mod.id);
    await db.update(communityQuestions).set({ status: "PUBLISHED" }).where(eq(communityQuestions.id, qid));
    await answers("t-os", () => `community:${qid}`, MIN, MIN / 2);

    const s = await studentQuestionStats();
    expect(s.weakTopics.find((t) => t.topic === "zz-few")).toBeUndefined();
    expect(s.weakTopics.find((t) => t.topic === "zz-hard")).toEqual({ topic: "zz-hard", answers: MIN, accuracy: 0.25 });
    expect(s.community.find((q) => q.id === qid)).toMatchObject({ answers: MIN, accuracy: 0.5 });
    expect(JSON.stringify(s)).not.toMatch(/@example\.com/);
  });
});
