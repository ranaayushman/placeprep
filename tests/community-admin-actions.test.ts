import { beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { communityQuestions, db, sessions, users } from "@/db";
import { hashToken } from "@/lib/auth";

// The server actions read the session cookie through next/headers; point it at a test session.
const jar = { token: "" };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "sid" && jar.token ? { value: jar.token } : undefined), set() {}, delete() {} }),
  headers: async () => new Headers(),
}));
vi.mock("next/cache", () => ({ revalidatePath() {} }));

const { approveAction, rejectAction } = await import("@/app/admin/community/actions");

async function sessionFor(role: "STUDENT" | "ADMIN") {
  const [u] = await db.insert(users).values({ email: `${role}-${Math.random()}@example.com`, name: `${role} User`, passwordHash: "x", role }).returning();
  const token = `t-${Math.random()}`;
  await db.insert(sessions).values({ userId: u.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3_600_000) });
  return { id: u.id, token };
}
const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

let questionId: string;
beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  const author = await sessionFor("STUDENT");
  [{ id: questionId }] = await db
    .insert(communityQuestions)
    .values({ authorId: author.id, section: "technical", topic: "t-os", company: "Infosys", stem: "Which scheduler gives every process a fixed time slice in turn?", options: ["Round Robin", "FCFS", "SJF", "Priority"], answerIndex: 0, explanation: "Round Robin cycles through ready processes with a fixed quantum.", sourceType: "ORIGINAL", status: "PENDING_REVIEW", normStem: "x", normOptions: "x" })
    .returning();
});

describe("admin community actions", () => {
  it("non-admins get a 404 and nothing changes", async () => {
    jar.token = (await sessionFor("STUDENT")).token;
    await expect(approveAction(form({ id: questionId }))).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
    await expect(rejectAction(form({ id: questionId, reason: "nope" }))).rejects.toThrow(/404|NOT_FOUND/);
    const [q] = await db.select().from(communityQuestions).where(eq(communityQuestions.id, questionId));
    expect(q.status).toBe("PENDING_REVIEW");
  });

  it("signed-out users get redirected to log in", async () => {
    jar.token = "";
    await expect(approveAction(form({ id: questionId }))).rejects.toThrow(/NEXT_REDIRECT/);
  });

  it("admins can approve", async () => {
    jar.token = (await sessionFor("ADMIN")).token;
    await expect(approveAction(form({ id: questionId }))).rejects.toThrow(/NEXT_REDIRECT/); // redirect back to the review page
    const [q] = await db.select().from(communityQuestions).where(eq(communityQuestions.id, questionId));
    expect(q.status).toBe("PUBLISHED");
  });
});
