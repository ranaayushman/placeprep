import { beforeAll, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, inArray, or } from "drizzle-orm";
import { adminActions, attemptQuestions, attempts, communityQuestions, db, events, sessions, userDeletions, users } from "@/db";
import { hashToken } from "@/lib/auth";
import { createPractice } from "@/lib/exam/service";

const jar = { token: "" };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "sid" && jar.token ? { value: jar.token } : undefined), set() {}, delete() {} }),
  headers: async () => new Headers(),
}));
vi.mock("next/cache", () => ({ revalidatePath() {}, revalidateTag() {}, unstable_cache: <T>(fn: T) => fn }));

const { deleteUser } = await import("@/app/admin/actions");

async function makeUser(role: "STUDENT" | "ADMIN" = "STUDENT") {
  const [u] = await db.insert(users).values({ email: `Del-${Math.random()}@Example.com`, name: "Del User", passwordHash: "x", role }).returning();
  const token = `t-${Math.random()}`;
  await db.insert(sessions).values({ userId: u.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3_600_000) });
  return { ...u, token };
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

let admin: Awaited<ReturnType<typeof makeUser>>;
beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  admin = await makeUser("ADMIN");
  jar.token = admin.token;
});

describe("admin delete user", () => {
  it("deletes the user and every linked row, and keeps a deletion record", async () => {
    const target = await makeUser();
    const other = await makeUser();
    const attemptId = await createPractice(target.id, { topicIds: ["z-crypt"], count: 3, timed: false }); // left IN_PROGRESS
    await db.insert(events).values({ userId: target.id, type: "login", ip: "1.2.3.4", userAgent: "test" });
    await db.insert(communityQuestions).values({ authorId: target.id, section: "technical", topic: "t-os", company: "Infosys", stem: "Which scheduler gives every process a fixed time slice?", options: ["Round Robin", "FCFS", "SJF", "Priority"], answerIndex: 0, explanation: "Round Robin uses a fixed quantum.", sourceType: "ORIGINAL", status: "PENDING_REVIEW", normStem: "x", normOptions: "x" });
    // Was once an admin: an audit row where they are the acting admin must not block the delete.
    await db.insert(adminActions).values({ adminId: target.id, targetUserId: other.id, action: "block" });
    await db.insert(adminActions).values({ adminId: admin.id, targetUserId: target.id, action: "block" });

    const url = await redirectTo(deleteUser(form({ userId: target.id, confirmEmail: ` ${target.email.toLowerCase()} `, reason: "user asked for deletion" })));
    expect(url).toMatch(/\/admin\/users\?msg=/);

    expect(await db.select().from(users).where(eq(users.id, target.id))).toHaveLength(0);
    expect(await db.select().from(sessions).where(eq(sessions.userId, target.id))).toHaveLength(0);
    expect(await db.select().from(attempts).where(eq(attempts.userId, target.id))).toHaveLength(0);
    expect(await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, attemptId))).toHaveLength(0);
    expect(await db.select().from(events).where(eq(events.userId, target.id))).toHaveLength(0);
    expect(await db.select().from(communityQuestions).where(eq(communityQuestions.authorId, target.id))).toHaveLength(0);
    expect(await db.select().from(adminActions).where(eq(adminActions.targetUserId, target.id))).toHaveLength(0);
    // The block they made on someone else stays, with the acting admin cleared.
    const [kept] = await db.select().from(adminActions).where(eq(adminActions.targetUserId, other.id));
    expect(kept.adminId).toBeNull();

    const [rec] = await db.select().from(userDeletions).where(eq(userDeletions.userId, target.id));
    expect(rec).toMatchObject({ adminId: admin.id, reason: "user asked for deletion", emailSha256: createHash("sha256").update(target.email.toLowerCase()).digest("hex") });
  });

  it("refuses a wrong email, an admin, and yourself", async () => {
    const target = await makeUser();
    const otherAdmin = await makeUser("ADMIN");
    const ok = { confirmEmail: target.email, reason: "testing" };
    expect(await redirectTo(deleteUser(form({ userId: target.id, ...ok, confirmEmail: "wrong@example.com" })))).toMatch(/doesn/);
    expect(await redirectTo(deleteUser(form({ userId: target.id, ...ok, reason: "" })))).toMatch(/reason/i);
    expect(await redirectTo(deleteUser(form({ userId: otherAdmin.id, confirmEmail: otherAdmin.email, reason: "testing" })))).toMatch(/admin/);
    expect(await redirectTo(deleteUser(form({ userId: admin.id, confirmEmail: admin.email, reason: "testing" })))).toMatch(/yourself/);
    const left = await db.select().from(users).where(or(eq(users.id, target.id), inArray(users.id, [otherAdmin.id, admin.id])));
    expect(left).toHaveLength(3);
  });

  it("non-admins get a 404", async () => {
    const student = await makeUser();
    const target = await makeUser();
    jar.token = student.token;
    await expect(deleteUser(form({ userId: target.id, confirmEmail: target.email, reason: "testing" }))).rejects.toThrow(/404|NOT_FOUND/);
    jar.token = admin.token;
    expect(await db.select().from(users).where(eq(users.id, target.id))).toHaveLength(1);
  });
});
