import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { attemptQuestions, attempts, bankReports, db } from "@/db";
import { COMMUNITY_PREFIX, isCommunityRef } from "@/lib/community/serve";
import { report as reportCommunity, CommunityError } from "@/lib/community/service";
import { generate, type Question } from "@/lib/questions";

export const BANK_REASONS = ["WRONG_ANSWER", "UNCLEAR", "OTHER"] as const;
export type BankReason = (typeof BANK_REASONS)[number];

export class ReportError extends Error {}

/**
 * One "Report a problem" for every question, by the attempt's own question row (so the client can't
 * report a question it never saw). Only after the answer was shown: a submitted test, or an answered
 * practice question; never mid-mock. Community questions go to their own review queue.
 */
export async function reportQuestion(userId: string, attemptQuestionId: string, reason: string, details?: string) {
  const [q] = await db
    .select({ ref: attemptQuestions.ref, topic: attemptQuestions.topic, chosen: attemptQuestions.chosenIndex, mode: attempts.mode, status: attempts.status })
    .from(attemptQuestions)
    .innerJoin(attempts, eq(attempts.id, attemptQuestions.attemptId))
    .where(and(eq(attemptQuestions.id, attemptQuestionId), eq(attempts.userId, userId)));
  if (!q) throw new ReportError("Question not found.");
  const revealed = q.status === "SUBMITTED" || (q.mode === "PRACTICE" && q.chosen != null);
  if (!revealed) throw new ReportError("You can report a question once its answer is shown.");

  if (isCommunityRef(q.ref)) {
    try {
      return await reportCommunity(userId, q.ref.slice(COMMUNITY_PREFIX.length), reason as never, details);
    } catch (e) {
      if (e instanceof CommunityError) throw new ReportError(e.message);
      throw e;
    }
  }
  if (!BANK_REASONS.includes(reason as BankReason)) throw new ReportError("Choose a reason.");
  await db
    .insert(bankReports)
    .values({ ref: q.ref, topic: q.topic, userId, reason: reason as BankReason, details: details?.trim().slice(0, 1000) || null })
    .onConflictDoNothing();
}

export type BankReportGroup = {
  ref: string; topic: string; open: number; reasons: Record<string, number>; details: string[]; lastAt: Date; question: Question | null;
};

/** Open reports grouped by question, most reported first; each with the question as the generator makes it now. */
export async function openBankReports(limit = 50): Promise<BankReportGroup[]> {
  const rows = await db.execute<{ ref: string; topic: string; open: number; wrong: number; unclear: number; other: number; details: string[] | null; last_at: number }>(sql`
    SELECT ref, MIN(topic) AS topic, COUNT(*) AS open,
           COUNT(*) FILTER (WHERE reason = 'WRONG_ANSWER') AS wrong,
           COUNT(*) FILTER (WHERE reason = 'UNCLEAR') AS unclear,
           COUNT(*) FILTER (WHERE reason = 'OTHER') AS other,
           (array_agg(details ORDER BY created_at DESC) FILTER (WHERE details IS NOT NULL))[1:3] AS details,
           MAX(created_at) AS last_at
    FROM bank_reports WHERE status = 'OPEN'
    GROUP BY ref ORDER BY COUNT(*) DESC, MAX(created_at) DESC LIMIT ${limit}`);
  return rows.map((r) => {
    let question: Question | null = null;
    try {
      question = generate(r.ref);
    } catch {
      /* topic removed since: show the report without the question */
    }
    return { ref: r.ref, topic: r.topic, open: Number(r.open), reasons: { WRONG_ANSWER: Number(r.wrong), UNCLEAR: Number(r.unclear), OTHER: Number(r.other) }, details: r.details ?? [], lastAt: new Date(Number(r.last_at)), question };
  });
}

/** Topics with the most open reports: a generator bug shows up as many reports across one topic. */
export async function openReportsByTopic() {
  return db
    .select({ topic: bankReports.topic, open: sql<number>`count(*)::int`, questions: sql<number>`count(DISTINCT ${bankReports.ref})::int` })
    .from(bankReports)
    .where(eq(bankReports.status, "OPEN"))
    .groupBy(bankReports.topic)
    .orderBy(desc(sql`count(*)`))
    .limit(10);
}

/** Closes every open report on one question. Staff only (callers check requireStaff). */
export async function closeBankReports(staffId: string, ref: string, status: "RESOLVED" | "DISMISSED") {
  const rows = await db
    .update(bankReports)
    .set({ status, resolvedBy: staffId, resolvedAt: new Date() })
    .where(and(eq(bankReports.ref, ref), eq(bankReports.status, "OPEN")))
    .returning({ id: bankReports.id });
  return rows.length;
}
