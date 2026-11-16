import "server-only";
import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, users } from "@/db";
import { SITE_URL } from "@/lib/site";

/**
 * Invite links. A student shares /r/<their id>; whoever signs up through it is stored as referred by
 * them. A referral counts once the new student has verified their email and finished onboarding, and
 * isn't blocked. Some mocks unlock after enough of them, or when an admin unlocks them for a user.
 */
export const REF_COOKIE = "pp_ref";
export const REF_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/** Exam id → successful referrals needed to unlock it. */
export const REFERRALS_TO_UNLOCK: Record<string, number> = {
  "cognizant-genc-hard": 2,
  "cognizant-genc-python-hard": 2,
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRefCode = (code: string) => UUID.test(code);

// shortcut: the code is the user id (random UUID, not secret, grants nothing); add a short code column if links need to be prettier.
export const inviteLink = (userId: string) => `${SITE_URL}/r/${userId}`;

/** The referrer from the invite cookie, if it names an existing, unblocked user. Call while creating an account. */
export async function referrerFromCookie(): Promise<string | null> {
  const code = (await cookies()).get(REF_COOKIE)?.value ?? "";
  if (!isRefCode(code)) return null;
  const [row] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, code), isNull(users.blockedAt))).limit(1);
  return row?.id ?? null;
}

export async function successfulReferrals(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.referredBy, userId), isNotNull(users.onboardedAt), isNotNull(users.emailVerifiedAt), isNull(users.blockedAt)));
  return row?.n ?? 0;
}

/** Referral count, and whether invite-only mocks are open anyway (admin unlock, or the user is an admin). */
export async function referralStatus(userId: string): Promise<{ have: number; bypass: boolean }> {
  const [[u], have] = await Promise.all([
    db.select({ unlocked: users.inviteUnlockedAt, role: users.role }).from(users).where(eq(users.id, userId)).limit(1),
    successfulReferrals(userId),
  ]);
  return { have, bypass: !!u?.unlocked || u?.role === "ADMIN" };
}

export const isInviteLocked = (examId: string, s: { have: number; bypass: boolean }) => !s.bypass && (REFERRALS_TO_UNLOCK[examId] ?? 0) > s.have;

/** Null when the exam is open to this user; otherwise how many referrals they have and need. */
export async function referralLock(userId: string, examId: string): Promise<{ have: number; need: number } | null> {
  const need = REFERRALS_TO_UNLOCK[examId];
  if (!need) return null;
  const s = await referralStatus(userId);
  return isInviteLocked(examId, s) ? { have: s.have, need } : null;
}
