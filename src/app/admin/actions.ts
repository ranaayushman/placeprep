"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createHash } from "node:crypto";
import { adminActions, announcements, db, userDeletions, users } from "@/db";
import { isConfiguredAdmin, requireAdmin, revokeAllSessions } from "@/lib/auth";
import { closeOpenAttempts } from "@/lib/exam/service";
import { sendCampaign } from "@/lib/brevo";
import { ANNOUNCEMENTS_TAG } from "@/lib/announcements";

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
  // Owner accounts: one leaked admin password must not be enough to lock the owner out.
  if (isConfiguredAdmin(target.email)) done(target.id, "This is an owner account (ADMIN_EMAILS); its role can't be changed here.");
  if (role === "ADMIN" && target.blockedAt) done(target.id, "Unblock the user before making them an admin.");
  await db.update(users).set({ role }).where(eq(users.id, target.id));
  await db.insert(adminActions).values({ adminId: admin.id, targetUserId: target.id, action: role === "ADMIN" ? "make_admin" : "remove_admin" });
  done(target.id, role === "ADMIN" ? `${target.name} is now an admin.` : `${target.name} is no longer an admin.`);
}

/** Permanent. Every linked row (attempts, events, sessions, submissions…) goes with the user via ON DELETE CASCADE. */
export async function deleteUser(form: FormData) {
  const { admin, target } = await loadTarget(form);
  const reason = z.string().trim().min(3).max(300).safeParse(form.get("reason"));
  if (target.id === admin.id) done(target.id, "You can't delete yourself.");
  if (target.role === "ADMIN") done(target.id, "Remove admin rights before deleting an admin.");
  if (String(form.get("confirmEmail") ?? "").trim().toLowerCase() !== target.email.toLowerCase()) done(target.id, "The email you typed doesn't match. Nothing was deleted.");
  if (!reason.success) done(target.id, "Add a reason (3+ characters) before deleting.");
  await revokeAllSessions(target.id);
  await closeOpenAttempts(target.id);
  await db.transaction(async (tx) => {
    await tx.insert(userDeletions).values({
      userId: target.id,
      emailSha256: createHash("sha256").update(target.email.toLowerCase()).digest("hex"),
      adminId: admin.id,
      reason: reason.data!,
    });
    await tx.delete(users).where(eq(users.id, target.id));
  });
  revalidatePath("/admin", "layout");
  redirect(`/admin/users?msg=${encodeURIComponent(`${target.name}'s account and all their data were deleted.`)}`);
}

const campaignSchema = z.object({
  subject: z.string().trim().min(3, "Add a subject (3+ characters).").max(150),
  body: z.string().trim().min(10, "Write the message (10+ characters).").max(20_000),
  confirm: z.literal("on", { errorMap: () => ({ message: "Tick the confirmation box to send." }) }),
});

export async function sendCampaignAction(form: FormData) {
  await requireAdmin();
  const parsed = campaignSchema.safeParse(Object.fromEntries(form));
  let msg: string;
  if (!parsed.success) msg = parsed.error.issues[0].message;
  else {
    try {
      await sendCampaign(parsed.data.subject, parsed.data.body);
      msg = `“${parsed.data.subject}” is sending. Stats appear below within a few minutes.`;
    } catch (err) {
      console.error("[brevo] send campaign failed:", err);
      msg = `Brevo refused the campaign: ${err instanceof Error ? err.message : "unknown error"}`;
    }
  }
  redirect(`/admin/campaigns?msg=${encodeURIComponent(msg)}`);
}

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Add a title (3+ characters).").max(100),
  body: z.string().trim().min(3, "Write the update (3+ characters).").max(1000),
});

export async function postAnnouncement(form: FormData) {
  const admin = await requireAdmin();
  const parsed = announcementSchema.safeParse(Object.fromEntries(form));
  if (parsed.success) {
    await db.insert(announcements).values({ ...parsed.data, authorId: admin.id });
    revalidateTag(ANNOUNCEMENTS_TAG);
  }
  redirect(`/admin/announcements?msg=${encodeURIComponent(parsed.success ? "Posted. Students see it under the bell now." : parsed.error.issues[0].message)}`);
}

export async function deleteAnnouncement(form: FormData) {
  await requireAdmin();
  await db.delete(announcements).where(eq(announcements.id, idSchema.parse(form.get("id"))));
  revalidateTag(ANNOUNCEMENTS_TAG);
  redirect("/admin/announcements?msg=Deleted.");
}
