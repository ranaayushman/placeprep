import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { db, sessions, users } from "@/db";
import { hashPassword, hashToken, verifyPassword } from "@/lib/auth";

const jar = { sid: "", oauth: "" };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (n === "sid" && jar.sid ? { value: jar.sid } : n === "g_oauth" && jar.oauth ? { value: jar.oauth } : undefined),
    set: (n: string, v: string) => {
      if (n === "sid") jar.sid = v;
    },
    delete() {},
  }),
  headers: async () => new Headers(),
}));
vi.mock("next/cache", () => ({ revalidatePath() {}, revalidateTag() {}, unstable_cache: <T>(fn: T) => fn }));
const google = { profile: { sub: "", email: "", name: "Real Owner" } };
vi.mock("@/lib/google", () => ({ googleEnabled: () => true, OAUTH_COOKIE: "g_oauth", finishGoogleAuth: async () => google.profile }));

const { register } = await import("@/app/(auth)/actions");
const { setRole } = await import("@/app/admin/actions");
const { changePassword } = await import("@/app/(app)/account/actions");
const { GET: googleCallback } = await import("@/app/api/auth/google/callback/route");

const OWNER = `owner-${Math.random()}@example.com`;
const rand = (p: string) => `${p}-${Math.random()}@example.com`;
const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const redirects = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return String((e as { digest?: string }).digest ?? e);
  }
  throw new Error("expected a redirect");
};
async function userWithSession(email: string, role: "STUDENT" | "ADMIN" = "STUDENT", password = "old-password") {
  const [u] = await db.insert(users).values({ email, name: "Some One", passwordHash: await hashPassword(password), role, onboardedAt: new Date() }).returning();
  const token = `t-${Math.random()}`;
  await db.insert(sessions).values({ userId: u.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3_600_000) });
  return { ...u, token };
}
const sessionCount = async (userId: string) => (await db.select().from(sessions).where(eq(sessions.userId, userId))).length;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  process.env.ADMIN_EMAILS = OWNER;
});
afterAll(() => {
  delete process.env.ADMIN_EMAILS;
});

describe("security", () => {
  it("password sign-up with an ADMIN_EMAILS address does not make an admin", async () => {
    await redirects(register(undefined, form({ name: "Imposter", email: OWNER, password: "a-long-password" })));
    const [u] = await db.select().from(users).where(eq(users.email, OWNER));
    expect(u.role).toBe("STUDENT");
  });

  it("Google sign-in to a pre-made password account drops the password and old sessions", async () => {
    // The imposter account from the test above, with a live session.
    const [squat] = await db.select().from(users).where(eq(users.email, OWNER));
    await db.insert(sessions).values({ userId: squat.id, tokenHash: hashToken("imposter"), expiresAt: new Date(Date.now() + 3_600_000) });
    google.profile = { sub: `g-${Math.random()}`, email: OWNER, name: "Real Owner" };
    jar.oauth = "st.ver";
    await redirects(googleCallback(new Request("http://x/api/auth/google/callback?code=c&state=st")));
    const [u] = await db.select().from(users).where(eq(users.email, OWNER));
    expect(u).toMatchObject({ passwordHash: null, googleId: google.profile.sub, role: "ADMIN" });
    const left = await db.select().from(sessions).where(eq(sessions.userId, u.id));
    expect(left.map((s) => s.tokenHash)).not.toContain(hashToken("imposter"));
    expect(left).toHaveLength(1); // only the real owner's new session
  });

  it("another admin can't change an owner's role", async () => {
    const admin = await userWithSession(rand("adm"), "ADMIN");
    const [owner] = await db.select().from(users).where(eq(users.email, OWNER));
    jar.sid = admin.token;
    expect(await redirects(setRole(form({ userId: owner.id, role: "STUDENT" })))).toMatch(/owner/);
    expect((await db.select().from(users).where(eq(users.id, owner.id)))[0].role).toBe("ADMIN");
  });

  it("changing the password needs the current one and signs out other devices", async () => {
    const u = await userWithSession(rand("pw"));
    await db.insert(sessions).values({ userId: u.id, tokenHash: hashToken("other-device"), expiresAt: new Date(Date.now() + 3_600_000) });
    jar.sid = u.token;
    expect(await changePassword(undefined, form({ current: "wrong", next: "brand-new-pass" }))).toEqual({ error: "Your current password is wrong." });
    expect(await changePassword(undefined, form({ current: "old-password", next: "brand-new-pass" }))).toEqual({ ok: true });
    const [row] = await db.select().from(users).where(eq(users.id, u.id));
    expect(await verifyPassword("brand-new-pass", row.passwordHash!)).toBe(true);
    expect(await sessionCount(u.id)).toBe(1); // just the fresh one for this device
  });
});
