"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { saveFeedback } from "@/lib/feedback";

export type FeedbackState = { ok?: boolean; error?: string } | undefined;

export async function feedbackAction(_: FeedbackState, form: FormData): Promise<FeedbackState> {
  const user = await requireUser();
  const attemptId = z.string().uuid().safeParse(form.get("attemptId"));
  if (!attemptId.success) return { error: "Something went wrong. Reload the page and try again." };
  const res = await saveFeedback(user.id, attemptId.data, Object.fromEntries(form));
  return res.ok ? { ok: true } : { error: res.error };
}
