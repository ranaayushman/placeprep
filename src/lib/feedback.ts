import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { attempts, db, feedback, users } from "@/db";

const part = z.string().trim().max(2000, "Keep each answer under 2000 characters.").transform((v) => v || null);
export const feedbackSchema = z
  .object({ product: part, questions: part, suggestions: part })
  .refine((f) => f.product || f.questions || f.suggestions, "Write something in at least one box.");

/** Saves feedback for a finished test of this user. Once per test: a second save is ignored. */
export async function saveFeedback(userId: string, attemptId: string, input: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = feedbackSchema.safeParse({ product: input.product ?? "", questions: input.questions ?? "", suggestions: input.suggestions ?? "" });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const [attempt] = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId), eq(attempts.status, "SUBMITTED")));
  if (!attempt) return { ok: false, error: "You can leave feedback after finishing this test." };
  await db.insert(feedback).values({ userId, attemptId, ...parsed.data }).onConflictDoNothing({ target: feedback.attemptId });
  return { ok: true };
}

export async function hasFeedback(attemptId: string) {
  return (await db.select({ id: feedback.id }).from(feedback).where(eq(feedback.attemptId, attemptId)).limit(1)).length > 0;
}

/** Newest first, for the admin panel. */
export function latestFeedback(limit = 100) {
  return db
    .select({ f: feedback, name: users.name, email: users.email, title: attempts.title, mode: attempts.mode, score: attempts.score, maxScore: attempts.maxScore })
    .from(feedback)
    .innerJoin(users, eq(users.id, feedback.userId))
    .innerJoin(attempts, eq(attempts.id, feedback.attemptId))
    .orderBy(desc(feedback.createdAt))
    .limit(limit);
}
