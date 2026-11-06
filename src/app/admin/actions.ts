"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminActions, db, users } from "@/db";
import { requireAdmin, revokeAllSessions } from "@/lib/auth";
import { closeOpenAttempts } from "@/lib/exam/service";

const idSchema = z.string().uuid();

async function loadTarget(form: FormData) {
  const admin = await requireAdmin();
  const userId = idSchema.parse(form.get("userId"));
  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target) redirect("/admin/users");
  return { admin, target };
}

function done(userId: string, msg: string) {
  revalidatePath("/admin", "layout");
  redirect(`/admin/users/${userId}?msg=${encodeURIComponent(msg)}`);
}

export async function blockUser(form: FormData) {
  const { admin, target } = await loadTarget(form);
  const reason = z.string().trim().min(3, "Give a reason").max(300).safeParse(form.get("reason"));
  if (!reason.success) done(target.id, "Add a reason (3+ characters) before blocking.");
  if (target.id === admin.id) done(target.id, "You can't block yourself.");
  if (target.role === "ADMIN") done(target.id, "Remove admin rights before blocking an admin.");
  await db.update(users).set({ blockedAt: new Date(), blockedReason: reason.data, blockedBy: admin.id }).where(eq(users.id, target.id));
  // Kick them out everywhere, immediately, and close any test they have open.
  await revokeAllSessions(target.id);
  await closeOpenAttempts(target.id);
  await db.insert(adminActions).values({ adminId: admin.id, targetUserId: target.id, action: "block", reason: reason.data });
  done(target.id, `${target.name} has been blocked and signed out.`);
}

export async function unblockUser(form: FormData) {
  const { admin, target } = await loadTarget(form);
  await db.update(users).set({ blockedAt: null, blockedReason: null, blockedBy: null }).where(eq(users.id, target.id));
  const note = z.string().trim().max(300).safeParse(form.get("reason"));
  await db.insert(adminActions).values({ adminId: admin.id, targetUserId: target.id, action: "unblock", reason: note.success ? note.data || null : null });
  if (form.get("from") === "blocked") {
    revalidatePath("/admin", "layout");
    redirect("/admin/blocked");
  }
  done(target.id, `${target.name} has been unblocked.`);
}

export async function revokeSessions(form: FormData) {
  const { admin, target } = await loadTarget(form);
  await revokeAllSessions(target.id);
  await db.insert(adminActions).values({ adminId: admin.id, targetUserId: target.id, action: "revoke_sessions" });
  done(target.id, "All sessions revoked. They'll need to log in again.");
}

export async function setRole(form: FormData) {
  const { admin, target } = await loadTarget(form);
  const role = z.enum(["STUDENT", "ADMIN"]).parse(form.get("role"));
  if (target.id === admin.id) done(target.id, "You can't change your own role.");
  if (role === "ADMIN" && target.blockedAt) done(target.id, "Unblock the user before making them an admin.");
  await db.update(users).set({ role }).where(eq(users.id, target.id));
  await db.insert(adminActions).values({ adminId: admin.id, targetUserId: target.id, action: role === "ADMIN" ? "make_admin" : "remove_admin" });
  done(target.id, role === "ADMIN" ? `${target.name} is now an admin.` : `${target.name} is no longer an admin.`);
}
