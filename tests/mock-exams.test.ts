import { beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { asc, eq } from "drizzle-orm";
import { attemptQuestions, attemptSections, db, mockExams, sessions, users } from "@/db";
import { hashToken } from "@/lib/auth";

const jar = { token: "" };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "sid" && jar.token ? { value: jar.token } : undefined), set() {}, delete() {} }),
  headers: async () => new Headers(),
}));
vi.mock("next/cache", () => ({ revalidatePath() {}, revalidateTag() {}, unstable_cache: <T>(fn: T) => fn }));

const { saveMockAction, publishMockAction, deleteMockAction } = await import("@/app/admin/mocks/actions");
const { listExams, getExam } = await import("@/lib/exam/exams");
const { createMock } = await import("@/lib/exam/service");

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
    return await p;
  } catch (e) {
    return String((e as { digest?: string }).digest ?? e);
  }
};
const tag = Math.random().toString(36).slice(2, 7);
const base = { company: "Cognizant", name: "GenC online assessment", short: `GenC ${tag}`, note: "" };
const genc = { ...base, section0: "math", questions0: "10", minutes0: "15", section1: "verbal", questions1: "8", minutes1: "10", section2: "reasoning", questions2: "6", minutes2: "8" };
const id = `genc-${tag}`;

let mod: { id: string; token: string }, admin: { id: string; token: string };
beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  mod = await sessionFor("MODERATOR");
  admin = await sessionFor("ADMIN");
});

describe("mock exams from the admin panel", () => {
  it("rejects bad patterns with a clear message", async () => {
    jar.token = mod.token;
    expect(await saveMockAction(undefined, form({ ...base, section0: "writing", questions0: "2", minutes0: "20" }))).toMatchObject({ error: /exactly 1 essay/ });
    expect(await saveMockAction(undefined, form({ ...base, section0: "math", questions0: "5", minutes0: "5", section1: "math", questions1: "5", minutes1: "5" }))).toMatchObject({ error: /only once/ });
    expect(await saveMockAction(undefined, form({ ...base, section0: "verbal", questions0: "3", minutes0: "5" }))).toMatchObject({ error: /at least 4/ });
    expect(await saveMockAction(undefined, form(base))).toMatchObject({ error: /at least one section/ });
    expect(await saveMockAction(undefined, form({ ...base, short: "Infosys SE", section0: "math", questions0: "5", minutes0: "5" }))).toMatchObject({ error: /built-in/ });
  });

  it("a moderator's draft is not takeable, and they can't publish it", async () => {
    jar.token = mod.token;
    expect(await redirectTo(saveMockAction(undefined, form(genc)))).toMatch(new RegExp(`/admin/mocks/${id}`));
    expect(await getExam(id)).toBeUndefined();
    expect((await listExams()).map((e) => e.id)).not.toContain(id);
    await expect(createMock(mod.id, { includeWriting: false, exam: id })).rejects.toThrow(/Unknown exam/);
    await expect(publishMockAction(form({ id, publish: "on" }))).rejects.toThrow(/404|NOT_FOUND/);
    // Edit the draft: drop to 2 sections.
    const edit = { ...genc, id, section2: "" };
    await redirectTo(saveMockAction(undefined, form(edit)));
    expect((await db.select().from(mockExams).where(eq(mockExams.id, id)))[0].pattern).toHaveLength(2);
  });

  it("once an admin publishes it, students can take it in that pattern", async () => {
    jar.token = admin.token;
    await redirectTo(publishMockAction(form({ id, publish: "on" })));
    expect((await listExams()).map((e) => e.id)).toContain(id);
    const student = await sessionFor("STUDENT");
    const attemptId = await createMock(student.id, { includeWriting: false, exam: id });
    const secs = await db.select().from(attemptSections).where(eq(attemptSections.attemptId, attemptId)).orderBy(asc(attemptSections.order));
    expect(secs.map((s) => [s.section, s.durationSec])).toEqual([["math", 900], ["verbal", 600]]);
    expect(await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, attemptId))).toHaveLength(18);

    jar.token = mod.token; // live mocks can't be edited
    expect(await saveMockAction(undefined, form({ ...genc, id }))).toMatchObject({ error: /Only drafts/ });
  });

  it("unpublished with attempts on it, it can't be deleted; a fresh draft can", async () => {
    jar.token = admin.token;
    await redirectTo(publishMockAction(form({ id })));
    expect(await getExam(id)).toBeUndefined();
    expect(decodeURIComponent(await redirectTo(deleteMockAction(form({ id }))) as string)).toMatch(/can't be deleted/);
    jar.token = mod.token;
    const other = `${tag}-other`;
    await redirectTo(saveMockAction(undefined, form({ ...genc, short: other })));
    await redirectTo(deleteMockAction(form({ id: other })));
    expect(await db.select().from(mockExams).where(eq(mockExams.id, other))).toHaveLength(0);
  });
});
