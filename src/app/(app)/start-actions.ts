"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { attempts, db } from "@/db";
import { requireUser } from "@/lib/auth";
import { createMock, createPractice, wrongRefs } from "@/lib/exam/service";
import { EXAM_BY_ID, type ExamId } from "@/lib/exam/pattern";
import { SECTION_LABELS, TOPIC_BY_ID } from "@/lib/questions";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

function guardStart(userId: string) {
  if (!rateLimit(`start:${userId}`, LIMITS.startTest.limit, LIMITS.startTest.windowMs).ok) {
    redirect(`/dashboard?error=${encodeURIComponent("You are starting tests too quickly. Try again later.")}`);
  }
}

const practiceSchema = z.object({
  topics: z.array(z.string()).min(1, "Choose at least one topic").max(40),
  count: z.coerce.number().int().min(3).max(30),
  timed: z.boolean(),
});

export async function startPractice(form: FormData) {
  const user = await requireUser();
  guardStart(user.id);
  const parsed = practiceSchema.safeParse({
    topics: form.getAll("topic").map(String).filter((t) => TOPIC_BY_ID.has(t)),
    count: form.get("count") ?? 10,
    timed: form.get("timed") === "on",
  });
  if (!parsed.success) redirect(`/practice?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const { topics, count, timed } = parsed.data;
  // Several topics from one section (dashboard "Section quizzes") get the section's name as the title.
  const sections = new Set(topics.map((t) => TOPIC_BY_ID.get(t)!.section));
  const title = topics.length > 1 && sections.size === 1 ? `${SECTION_LABELS[[...sections][0]]} quiz` : undefined;
  // Topics the student opted into community questions for (only among the chosen topics).
  const communityTopics = form.getAll("community").map(String).filter((t) => topics.includes(t));
  const id = await createPractice(user.id, { topicIds: topics, count, timed, title, communityTopics });
  redirect(`/attempt/${id}`);
}

export async function startMock(form: FormData) {
  const user = await requireUser();
  // Only one mock at a time: resume an unfinished one instead of starting another.
  const [open] = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.userId, user.id), eq(attempts.mode, "MOCK"), eq(attempts.status, "IN_PROGRESS")))
    .limit(1);
  if (open) redirect(`/attempt/${open.id}`);
  guardStart(user.id);
  const examId = String(form.get("exam") ?? "infosys-se");
  if (!EXAM_BY_ID.has(examId)) redirect("/dashboard");
  const id = await createMock(user.id, { exam: examId as ExamId, includeWriting: form.get("writing") === "on" });
  redirect(`/attempt/${id}`);
}

export async function retryMistakes() {
  const user = await requireUser();
  const refs = (await wrongRefs(user.id, 15)).map((r) => r.ref);
  if (!refs.length) redirect("/dashboard");
  const id = await createPractice(user.id, { topicIds: [], count: refs.length, timed: false, refs, title: "Retry: recent mistakes" });
  redirect(`/attempt/${id}`);
}
