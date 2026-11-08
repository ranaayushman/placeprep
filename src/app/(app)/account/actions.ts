"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, users } from "@/db";
import { createSession, hashPassword, requireUser, revokeAllSessions, verifyPassword } from "@/lib/auth";
import { logEvent } from "@/lib/events";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export type PasswordState = { error?: string; ok?: boolean } | undefined;

const schema = z.object({
  current: z.string().min(1, "Enter your current password").max(128),
  next: z.string().min(8, "New password must be at least 8 characters").max(128),
});

/** Changes the password and signs out every other device (this one gets a fresh session). */
export async function changePassword(_: PasswordState, form: FormData): Promise<PasswordState> {
  const user = await requireUser();
  if (!(await rateLimit(`password:${user.id}`, LIMITS.password.limit, LIMITS.password.windowMs)).ok) {
    return { error: "Too many tries. Wait 15 minutes and try again." };
  }
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id));
  if (!row?.hash) return { error: "You sign in with Google, so there's no password to change." };
  if (!(await verifyPassword(parsed.data.current, row.hash))) return { error: "Your current password is wrong." };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.next) }).where(eq(users.id, user.id));
  await revokeAllSessions(user.id);
  await createSession(user.id);
  await logEvent("password_changed", { userId: user.id });
  return { ok: true };
}
