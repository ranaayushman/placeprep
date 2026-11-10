"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, users } from "@/db";
import { createSession, hashPassword, requireUser, revokeAllSessions, verifyPassword } from "@/lib/auth";
import { logEvent } from "@/lib/events";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { cancelDeletionRequest, requestDeletion } from "@/lib/deletion-requests";

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

export type DeletionState = { error?: string } | undefined;

/** The student asks for deletion; an admin carries it out (Admin → Deletion requests) within 30 days. */
export async function requestDeletionAction(_: DeletionState, form: FormData): Promise<DeletionState> {
  const user = await requireUser();
  if (user.role === "ADMIN") return { error: "Admins can't request deletion here. Ask another admin to remove your admin rights first." };
  if (form.get("confirm") !== "on") return { error: "Tick the box to confirm." };
  await requestDeletion(user.id, String(form.get("reason") ?? ""));
  await logEvent("deletion_requested", { userId: user.id });
  revalidatePath("/account");
  return undefined;
}

export async function cancelDeletionAction() {
  const user = await requireUser();
  await cancelDeletionRequest(user.id);
  revalidatePath("/account");
}
