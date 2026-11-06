import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, sessions, users, type User } from "@/db";

export const SESSION_COOKIE = "sid";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LAST_SEEN_THROTTLE_MS = 60 * 1000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Emails listed in ADMIN_EMAILS (comma-separated) are made admins when they register or log in. */
export function isConfiguredAdmin(email: string) {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await Promise.all([
    db.insert(sessions).values({ tokenHash: hashToken(token), userId, expiresAt }),
    // Opportunistic cleanup of this user's expired sessions.
    db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date()))),
  ]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export type SafeUser = Pick<User, "id" | "email" | "name" | "role" | "onboardedAt">;

/**
 * Returns the logged-in user or null. Validates the session (and that the user is not blocked)
 * against the DB. Wrapped in React `cache` so a page render does this query once, not per component.
 */
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, onboardedAt: users.onboardedAt, lastSeenAt: users.lastSeenAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), isNull(users.blockedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  // Throttled write: at most one lastSeen update per user per minute, even with many requests.
  const cutoff = new Date(Date.now() - LAST_SEEN_THROTTLE_MS);
  if (!row.lastSeenAt || row.lastSeenAt < cutoff) {
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(and(eq(users.id, row.id), or(isNull(users.lastSeenAt), lt(users.lastSeenAt, cutoff))));
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role, onboardedAt: row.onboardedAt };
});

/** For pages: redirects to /login when not signed in. */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Where a freshly signed-in user should land. */
export const homeFor = (u: Pick<User, "role" | "onboardedAt">) => (u.role === "ADMIN" ? "/admin" : u.onboardedAt ? "/dashboard" : "/onboarding");

/** For admin pages and actions. Non-admins get a 404 so the panel's existence isn't revealed. */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();
  return user;
}
