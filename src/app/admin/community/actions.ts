"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireStaff } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { communityQuestions, db } from "@/db";
import { approve, CommunityError, editAndApprove, markDuplicate, reject } from "@/lib/community/service";

const back = (id: string, msg: string) => {
  revalidatePath("/admin", "layout");
  redirect(`/admin/community/${encodeURIComponent(id)}?msg=${encodeURIComponent(msg)}`);
};

/**
 * Runs one review decision (admins and moderators); validation and state errors come back as a
 * message on the review page. `publishes`: a moderator can't publish their own question.
 */
async function run(form: FormData, fn: (adminId: string, id: string) => Promise<unknown>, ok: string, publishes = false) {
  const admin = await requireStaff(); // students get a 404
  const id = String(form.get("id") ?? "");
  if (publishes && admin.role === "MODERATOR") {
    const [q] = await db.select({ authorId: communityQuestions.authorId }).from(communityQuestions).where(eq(communityQuestions.id, id));
    if (q?.authorId === admin.id) back(id, "You wrote this question, so another reviewer has to publish it.");
  }
  try {
    await fn(admin.id, id);
  } catch (e) {
    if (e instanceof CommunityError) back(id, e.message);
    if (e instanceof ZodError) back(id, e.issues[0].message);
    throw e;
  }
  back(id, ok);
}

export async function approveAction(form: FormData) {
  await run(form, (a, id) => approve(a, id), "Published.", true);
}

export async function rejectAction(form: FormData) {
  await run(form, (a, id) => reject(a, id, String(form.get("reason") ?? "")), "Rejected. The uploader can see your reason.");
}

export async function duplicateAction(form: FormData) {
  await run(form, (a, id) => markDuplicate(a, id, String(form.get("ref") ?? "").trim()), "Marked as a duplicate.");
}

export async function editApproveAction(form: FormData) {
  const v = Object.fromEntries([...form.entries()].map(([k, x]) => [k, String(x)]));
  await run(
    form,
    (a, id) =>
      editAndApprove(a, id, {
        section: v.section as never,
        topic: v.topic,
        company: v.company as never,
        companyOther: v.companyOther || undefined,
        year: v.year ? Number(v.year) : undefined,
        stem: v.stem,
        code: v.code || undefined,
        options: [0, 1, 2, 3].map((i) => v[`option${i}`] ?? ""),
        answerIndex: v.answer ? Number(v.answer) : (undefined as never),
        explanation: v.explanation,
        sourceType: v.sourceType as never,
      }),
    "Edited and published.",
    true,
  );
}
