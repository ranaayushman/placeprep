import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { db, emailOtps, users } from "@/db";
import { createOtp, OTP_MAX_ATTEMPTS, OTP_MAX_SENDS_PER_HOUR, OTP_TTL_MS, verifyOtp } from "@/lib/otp";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set() {}, delete() {} }),
  headers: async () => new Headers(),
}));
vi.mock("next/cache", () => ({ revalidatePath() {}, revalidateTag() {}, unstable_cache: <T>(fn: T) => fn }));

const { register } = await import("@/app/(auth)/actions");

const newUser = async () => {
  const [u] = await db.insert(users).values({ email: `otp-${Math.random()}@example.com`, name: "Otp User", passwordHash: "x", emailVerifiedAt: null }).returning();
  return u;
};
const verifiedAt = async (id: string) => (await db.select({ v: users.emailVerifiedAt }).from(users).where(eq(users.id, id)))[0]?.v;
const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, "0");

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
});

describe("email OTP", () => {
  it("verifies with the right code, and the code can't be used twice", async () => {
    const u = await newUser();
    const res = await createOtp(u.id);
    if (!res.ok) throw new Error("expected a code");
    expect(res.code).toMatch(/^\d{6}$/);
    expect(await verifyOtp(u.id, wrong(res.code))).toBe("wrong");
    expect(await verifiedAt(u.id)).toBeNull();
    expect(await verifyOtp(u.id, res.code)).toBe("ok");
    expect(await verifiedAt(u.id)).toBeInstanceOf(Date);
    expect(await verifyOtp(u.id, res.code)).toBe("expired");
  });

  it("locks the code after 5 wrong guesses, even if the 6th is right", async () => {
    const u = await newUser();
    const res = await createOtp(u.id);
    if (!res.ok) throw new Error("expected a code");
    for (let i = 1; i < OTP_MAX_ATTEMPTS; i++) expect(await verifyOtp(u.id, wrong(res.code))).toBe("wrong");
    expect(await verifyOtp(u.id, wrong(res.code))).toBe("locked");
    expect(await verifyOtp(u.id, res.code)).toBe("locked");
    expect(await verifiedAt(u.id)).toBeNull();
  });

  it("expires after 10 minutes", async () => {
    const u = await newUser();
    const t = Date.now();
    const res = await createOtp(u.id, t);
    if (!res.ok) throw new Error("expected a code");
    expect(await verifyOtp(u.id, res.code, t + OTP_TTL_MS + 1)).toBe("expired");
  });

  it("allows one email a minute and 5 an hour", async () => {
    const u = await newUser();
    const t = Date.now();
    expect((await createOtp(u.id, t)).ok).toBe(true);
    expect(await createOtp(u.id, t + 30_000)).toEqual({ ok: false, retryAfterSec: 30 });
    for (let i = 1; i < OTP_MAX_SENDS_PER_HOUR; i++) expect((await createOtp(u.id, t + i * 61_000)).ok).toBe(true);
    const capped = await createOtp(u.id, t + OTP_MAX_SENDS_PER_HOUR * 61_000);
    expect(capped.ok).toBe(false);
    expect((await createOtp(u.id, t + 60 * 60 * 1000 + 1)).ok).toBe(true); // new hour
  });

  it("new users default to verified (Google, existing accounts)", async () => {
    const [u] = await db.insert(users).values({ email: `g-${Math.random()}@example.com`, name: "G" }).returning();
    expect(u.emailVerifiedAt).toBeInstanceOf(Date);
  });
});

describe("register with EMAIL_OTP=on", () => {
  beforeAll(() => {
    process.env.EMAIL_OTP = "on";
  });
  afterAll(() => {
    delete process.env.EMAIL_OTP;
  });
  const form = (email: string) => {
    const f = new FormData();
    f.set("name", "New Student");
    f.set("email", email);
    f.set("password", "a-long-password");
    return f;
  };

  it("creates an unverified account with a pending code, and sends the user to /verify-email", async () => {
    const email = `reg-${Math.random()}@example.com`;
    await expect(register(undefined, form(email))).rejects.toThrow(/NEXT_REDIRECT/);
    const [u] = await db.select().from(users).where(eq(users.email, email));
    expect(u.emailVerifiedAt).toBeNull();
    expect(await db.select().from(emailOtps).where(eq(emailOtps.userId, u.id))).toHaveLength(1);
  });

  it("a new sign-up replaces an unverified account, but never a verified one", async () => {
    const email = `squat-${Math.random()}@example.com`;
    const [squat] = await db.insert(users).values({ email, name: "Squatter", passwordHash: "x", emailVerifiedAt: null }).returning();
    await expect(register(undefined, form(email))).rejects.toThrow(/NEXT_REDIRECT/);
    const [u] = await db.select().from(users).where(eq(users.email, email));
    expect(u.id).not.toBe(squat.id);
    expect(u.name).toBe("New Student");

    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, u.id));
    expect(await register(undefined, form(email))).toEqual({ error: "An account with this email already exists" });
  });
});

describe("register with EMAIL_OTP off (default)", () => {
  it("creates a verified account and skips the code", async () => {
    const f = new FormData();
    const email = `nootp-${Math.random()}@example.com`;
    for (const [k, v] of Object.entries({ name: "No Otp", email, password: "a-long-password" })) f.set(k, v);
    await expect(register(undefined, f)).rejects.toThrow(/NEXT_REDIRECT/);
    const [u] = await db.select().from(users).where(eq(users.email, email));
    expect(u.emailVerifiedAt).toBeInstanceOf(Date);
    expect(await db.select().from(emailOtps).where(eq(emailOtps.userId, u.id))).toHaveLength(0);
  });
});
