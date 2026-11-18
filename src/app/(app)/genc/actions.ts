"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ExamError } from "@/lib/exam/service";
import { isGencVariant, startRun } from "@/lib/exam/runs";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export async function startGenc(form: FormData) {
  const user = await requireUser();
  const variant = String(form.get("variant") ?? "");
  const back = isGencVariant(variant) ? `/genc/suite/${variant}` : "/genc";
  if (!(await rateLimit(`start:${user.id}`, LIMITS.startTest.limit, LIMITS.startTest.windowMs)).ok) {
    redirect(`${back}?error=${encodeURIComponent("You are starting tests too quickly. Try again later.")}`);
  }
  let id: string;
  try {
    id = await startRun(user.id, variant, String(form.get("difficulty") ?? "standard"));
  } catch (e) {
    if (e instanceof ExamError) redirect(`${back}?error=${encodeURIComponent(e.message)}`);
    throw e;
  }
  redirect(`/genc/${id}`);
}
