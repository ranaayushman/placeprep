"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { CommunityError, REPORT_REASONS, report, submitQuestion } from "@/lib/community/service";

export type SubmitState = { error?: string; values?: Record<string, string> } | undefined;

export async function submitAction(_: SubmitState, form: FormData): Promise<SubmitState> {
  const user = await requireUser();
  const v = Object.fromEntries([...form.entries()].map(([k, x]) => [k, String(x)]));
  let status: string;
  try {
    ({ status } = await submitQuestion(user.id, {
      section: v.section as never,
      topic: v.topic ?? "",
      company: v.company as never,
      companyOther: v.companyOther || undefined,
      year: v.year ? Number(v.year) : undefined,
      stem: v.stem ?? "",
      code: v.code || undefined,
      options: [0, 1, 2, 3].map((i) => v[`option${i}`] ?? ""),
      answerIndex: v.answer ? Number(v.answer) : (undefined as never), // missing → "Mark the correct option", never option A
      explanation: v.explanation ?? "",
      sourceType: v.sourceType as never,
      ownWords: (v.ownWords === "on") as true,
    }));
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0].message, values: v };
    if (e instanceof CommunityError) return { error: e.message, values: v };
    throw e;
  }
  redirect(`/community?submitted=${status}`);
}

/** "Report a problem" on a community question (practice feedback and results). */
export async function reportAction(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("questionId") ?? "");
  const reason = String(form.get("reason") ?? "") as (typeof REPORT_REASONS)[number];
  try {
    await report(user.id, id, reason, String(form.get("details") ?? ""));
  } catch (e) {
    if (!(e instanceof CommunityError)) throw e;
  }
  return { ok: true };
}
