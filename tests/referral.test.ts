import { beforeAll, describe, expect, it, vi } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";

// referrerFromCookie reads the invite cookie through next/headers.
let cookie: string | undefined;
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => (cookie ? { value: cookie } : undefined) }) }));
const { inviteLink, isRefCode, referralLock, referrerFromCookie, successfulReferrals } = await import("@/lib/referral");

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
});

const mk = async (patch: Partial<typeof users.$inferInsert> = {}) =>
  (await db.insert(users).values({ email: `ref-${Math.random()}@example.com`, name: "Ref", passwordHash: "x", ...patch }).returning())[0];

describe("referrals", () => {
  it("reads the referrer from the cookie only when it names a real, unblocked user", async () => {
    const a = await mk();
    const blocked = await mk({ blockedAt: new Date() });
    const link = await inviteLink(a.id);
    const code = link.split("/r/")[1];
    expect(isRefCode(code)).toBe(true);
    expect(code).toHaveLength(7);
    expect(await inviteLink(a.id)).toBe(link); // stable once made
    expect(await inviteLink(blocked.id)).not.toBe(link);
    cookie = code;
    expect(await referrerFromCookie()).toBe(a.id);
    cookie = (await inviteLink(blocked.id)).split("/r/")[1];
    expect(await referrerFromCookie()).toBeNull();
    cookie = a.id; // raw ids are not codes
    expect(await referrerFromCookie()).toBeNull();
    cookie = "zzzzzzz"; // well-formed, nobody's
    expect(await referrerFromCookie()).toBeNull();
  });

  it("counts only onboarded, verified, unblocked referrals, and unlocks Extreme at 2", async () => {
    const a = await mk();
    expect(await referralLock(a.id, "cognizant-genc")).toBeNull(); // not an invite-only mock
    expect(await referralLock(a.id, "cognizant-genc-hard")).toEqual({ have: 0, need: 2 });
    await mk({ referredBy: a.id }); // never finished onboarding
    await mk({ referredBy: a.id, onboardedAt: new Date(), emailVerifiedAt: null }); // unverified
    await mk({ referredBy: a.id, onboardedAt: new Date(), blockedAt: new Date() }); // blocked
    const good = await mk({ referredBy: a.id, onboardedAt: new Date() });
    expect(await successfulReferrals(a.id)).toBe(1);
    expect(await referralLock(a.id, "cognizant-genc-python-hard")).toEqual({ have: 1, need: 2 });
    await mk({ referredBy: a.id, onboardedAt: new Date() });
    expect(await referralLock(a.id, "cognizant-genc-hard")).toBeNull();
    expect(await referralLock(a.id, "cognizant-genc-python-hard")).toBeNull();
    // An admin unlock opens them with no referrals; admins never see the lock.
    const c = await mk();
    expect(await referralLock(c.id, "cognizant-genc-hard")).not.toBeNull();
    await db.update(users).set({ inviteUnlockedAt: new Date() }).where(eq(users.id, c.id));
    expect(await referralLock(c.id, "cognizant-genc-hard")).toBeNull();
    expect(await referralLock((await mk({ role: "ADMIN" })).id, "cognizant-genc-python-hard")).toBeNull();
    // Deleting the referrer keeps the referred account (FK sets null).
    await db.delete(users).where(eq(users.id, a.id));
    expect((await db.select().from(users).where(eq(users.id, good.id)))[0].referredBy).toBeNull();
  });
});
