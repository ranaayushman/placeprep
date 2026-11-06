import "server-only";
import { and, count, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { adminActions, attemptQuestions, attempts, communityQuestions, db, questionFingerprints, questionReports, submissionMatches, users } from "@/db";
import { logEvent } from "@/lib/events";
import {
  DUPLICATE_POSSIBLE,
  MATCH_FLOOR,
  MAX_SUBMISSIONS_PER_DAY,
  MIN_ANSWERED_TO_UPLOAD,
  REPORTS_TO_HIDE,
  STATS_DOMINANT_WRONG,
  STATS_LOW_ACCURACY,
  STATS_MIN_ANSWERS,
} from "./config";
import { findMatches } from "./fingerprints";
import { normOptions, normStem } from "./normalize";
import { COMMUNITY_PREFIX } from "./serve";
import { companyLabel, questionSchema, type QuestionInput, type ValidQuestion } from "./validate";

export class CommunityError extends Error {}

const DAY = 86_400_000;
const ref = (id: string) => `${COMMUNITY_PREFIX}${id}`;

/** Who may upload: enough practice behind them, and under the daily cap. Blocked users have no session at all. */
export async function uploadEligibility(userId: string) {
  const [[{ answered }], [{ today }]] = await Promise.all([
    db
      .select({ answered: count() })
      .from(attemptQuestions)
      .innerJoin(attempts, eq(attempts.id, attemptQuestions.attemptId))
      .where(and(eq(attempts.userId, userId), isNotNull(attemptQuestions.chosenIndex))),
    db
      .select({ today: count() })
      .from(communityQuestions)
      .where(and(eq(communityQuestions.authorId, userId), gte(communityQuestions.createdAt, new Date(Date.now() - DAY)))),
  ]);
  return {
    answered,
    today,
    needMore: Math.max(0, MIN_ANSWERED_TO_UPLOAD - answered),
    ok: answered >= MIN_ANSWERED_TO_UPLOAD && today < MAX_SUBMISSIONS_PER_DAY,
  };
}

const fields = (v: ValidQuestion) => ({
  section: v.section,
  topic: v.topic,
  company: companyLabel(v),
  year: v.year ?? null,
  stem: v.stem,
  code: v.code?.trim() || null,
  options: v.options,
  answerIndex: v.answerIndex,
  explanation: v.explanation,
  sourceType: v.sourceType,
  normStem: normStem(v.stem, v.code?.trim()),
  normOptions: normOptions(v.options),
});

/** Validate → normalise → similarity check → queue (PENDING_REVIEW or FLAGGED_DUPLICATE). */
export async function submitQuestion(userId: string, input: QuestionInput) {
  const elig = await uploadEligibility(userId);
  if (elig.needMore) throw new CommunityError(`Answer ${elig.needMore} more practice questions before uploading.`);
  if (!elig.ok) throw new CommunityError(`You can upload ${MAX_SUBMISSIONS_PER_DAY} questions a day. Try again tomorrow.`);
  const f = fields(questionSchema.parse(input));
  const matches = (await findMatches(f)).filter((m) => m.score >= MATCH_FLOOR);
  const best = matches[0]?.score ?? 0;
  const status = best >= DUPLICATE_POSSIBLE ? "FLAGGED_DUPLICATE" : "PENDING_REVIEW";
  const row = await db.transaction(async (tx) => {
    const [q] = await tx.insert(communityQuestions).values({ ...f, authorId: userId, status, bestMatchScore: best }).returning();
    await tx.insert(questionFingerprints).values({ ref: ref(q.id), section: f.section, topic: f.topic, normStem: f.normStem, normOptions: f.normOptions, source: "COMMUNITY" });
    if (matches.length) {
      await tx.insert(submissionMatches).values(matches.map((m) => ({ submissionId: q.id, matchedRef: m.ref, score: m.score, stemScore: m.stemScore, optionsScore: m.optionsScore })));
    }
    return q;
  });
  await logEvent("question_submitted", { userId, meta: { id: row.id, section: f.section, topic: f.topic } });
  if (status === "FLAGGED_DUPLICATE") await logEvent("question_flagged", { userId, meta: { id: row.id, score: Number(best.toFixed(2)), match: matches[0].ref } });
  return row;
}

// ---------------------------------------------------------------------------------------------
// Admin decisions. Callers must have checked requireAdmin(); every decision is audited.

const IN_QUEUE = ["PENDING_REVIEW", "FLAGGED_DUPLICATE", "NEEDS_REVIEW"] as const;
/** Edit, reject and mark-duplicate also work on published questions (e.g. to fix a wrong key). */
const IN_QUEUE_OR_PUBLISHED = [...IN_QUEUE, "PUBLISHED"] as const;

async function decide(
  adminId: string,
  id: string,
  action: string,
  patch: Partial<typeof communityQuestions.$inferInsert>,
  opts: { keepFingerprint: boolean; reason?: string; from: readonly (typeof communityQuestions.$inferSelect)["status"][] },
) {
  return db.transaction(async (tx) => {
    const [q] = await tx
      .update(communityQuestions)
      .set({ ...patch, reviewedBy: adminId, reviewedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(communityQuestions.id, id), inArray(communityQuestions.status, opts.from)))
      .returning();
    if (!q) throw new CommunityError("This question is not in a state where that is possible (it may have been reviewed already).");
    if (opts.keepFingerprint) {
      await tx.update(questionFingerprints).set({ section: q.section, topic: q.topic, normStem: q.normStem, normOptions: q.normOptions }).where(eq(questionFingerprints.ref, ref(q.id)));
    } else {
      await tx.delete(questionFingerprints).where(eq(questionFingerprints.ref, ref(q.id)));
    }
    // Reports that led here are dealt with by this decision.
    await tx.update(questionReports).set({ status: "RESOLVED" }).where(and(eq(questionReports.questionId, q.id), eq(questionReports.status, "OPEN")));
    await tx.insert(adminActions).values({ adminId, targetUserId: q.authorId, action, reason: [q.id, opts.reason].filter(Boolean).join(" · ") });
    return q;
  });
}

export async function approve(adminId: string, id: string) {
  const q = await decide(adminId, id, "community_approve", { status: "PUBLISHED", rejectionReason: null, duplicateOfRef: null }, { keepFingerprint: true, from: IN_QUEUE });
  await logEvent("question_approved", { userId: q.authorId, withRequest: false, meta: { id } });
  return q;
}

/** Admin fixes wording, options, answer or explanation, then publishes. Past attempts keep their snapshot. */
export async function editAndApprove(adminId: string, id: string, input: Omit<QuestionInput, "ownWords">) {
  const f = fields(questionSchema.parse({ ...input, ownWords: true }));
  const q = await decide(adminId, id, "community_edit_approve", { ...f, status: "PUBLISHED", rejectionReason: null, duplicateOfRef: null }, { keepFingerprint: true, from: IN_QUEUE_OR_PUBLISHED });
  await logEvent("question_approved", { userId: q.authorId, withRequest: false, meta: { id, edited: true } });
  return q;
}

export async function reject(adminId: string, id: string, reason: string) {
  if (reason.trim().length < 3) throw new CommunityError("Give the uploader a reason.");
  const q = await decide(adminId, id, "community_reject", { status: "REJECTED", rejectionReason: reason.trim() }, { keepFingerprint: false, reason: reason.trim(), from: IN_QUEUE_OR_PUBLISHED });
  await logEvent("question_rejected", { userId: q.authorId, withRequest: false, meta: { id } });
  return q;
}

export async function markDuplicate(adminId: string, id: string, duplicateOfRef: string) {
  const [target] = await db.select({ ref: questionFingerprints.ref }).from(questionFingerprints).where(eq(questionFingerprints.ref, duplicateOfRef));
  if (!target || duplicateOfRef === ref(id)) throw new CommunityError("Pick an existing question it duplicates.");
  const q = await decide(
    adminId,
    id,
    "community_duplicate",
    { status: "REJECTED", duplicateOfRef, rejectionReason: "We already have this question, so it was not added." },
    { keepFingerprint: false, reason: `duplicate of ${duplicateOfRef}`, from: IN_QUEUE_OR_PUBLISHED },
  );
  await logEvent("question_rejected", { userId: q.authorId, withRequest: false, meta: { id, duplicateOf: duplicateOfRef } });
  return q;
}

// ---------------------------------------------------------------------------------------------
// Monitoring

export const REPORT_REASONS = ["WRONG_ANSWER", "UNCLEAR", "COPIED", "OTHER"] as const;

/** One report per student per question; REPORTS_TO_HIDE open reports hide it from practice. */
export async function report(userId: string, questionId: string, reason: (typeof REPORT_REASONS)[number], details?: string) {
  if (!REPORT_REASONS.includes(reason)) throw new CommunityError("Choose a reason.");
  const [q] = await db.select({ id: communityQuestions.id, status: communityQuestions.status }).from(communityQuestions).where(eq(communityQuestions.id, questionId));
  if (!q || (q.status !== "PUBLISHED" && q.status !== "NEEDS_REVIEW")) throw new CommunityError("Question not found.");
  await db.insert(questionReports).values({ questionId, userId, reason, details: details?.trim().slice(0, 1000) || null }).onConflictDoNothing();
  const [{ open }] = await db
    .select({ open: count() })
    .from(questionReports)
    .where(and(eq(questionReports.questionId, questionId), eq(questionReports.status, "OPEN")));
  if (open >= REPORTS_TO_HIDE) {
    await db.update(communityQuestions).set({ status: "NEEDS_REVIEW", updatedAt: new Date() }).where(and(eq(communityQuestions.id, questionId), eq(communityQuestions.status, "PUBLISHED")));
  }
  await logEvent("question_reported", { userId, meta: { id: questionId, reason, open } });
  return { open };
}

/**
 * Published questions whose answer statistics suggest a wrong key: ≥ STATS_MIN_ANSWERS answers and
 * accuracy < STATS_LOW_ACCURACY, or one wrong option picked by ≥ STATS_DOMINANT_WRONG of students.
 * (Community options are never shuffled, so chosen_index is comparable across attempts.)
 */
export async function suspiciousAnswerKeys() {
  const rows = await db.execute<{ id: string; answers: number; accuracy: number; top_wrong: number | null; top_wrong_share: number | null }>(sql`
    WITH a AS (
      -- ::int matters: with an untyped parameter Postgres picks the regex overload of substring.
      SELECT substring(q.ref FROM ${COMMUNITY_PREFIX.length + 1}::int) AS id, q.chosen_index, q.answer_index
      FROM attempt_questions q
      WHERE q.ref LIKE ${COMMUNITY_PREFIX + "%"} AND q.chosen_index IS NOT NULL
    ), per AS (
      SELECT id, count(*) AS answers, avg((chosen_index = answer_index)::int)::float AS accuracy FROM a GROUP BY id
    ), wrong AS (
      SELECT DISTINCT ON (id) id, chosen_index AS top_wrong, count(*) AS n
      FROM a WHERE chosen_index <> answer_index GROUP BY id, chosen_index ORDER BY id, count(*) DESC
    )
    SELECT per.id, per.answers, per.accuracy, wrong.top_wrong, (wrong.n::float / per.answers) AS top_wrong_share
    FROM per LEFT JOIN wrong USING (id)
    WHERE per.answers >= ${STATS_MIN_ANSWERS}
      AND (per.accuracy < ${STATS_LOW_ACCURACY} OR wrong.n::float / per.answers >= ${STATS_DOMINANT_WRONG})`);
  return rows.map((r) => ({ ...r, answers: Number(r.answers), accuracy: Number(r.accuracy), topWrongShare: r.top_wrong_share == null ? null : Number(r.top_wrong_share) }));
}

// ---------------------------------------------------------------------------------------------
// Reads for pages

export const mySubmissions = (userId: string) =>
  db.select().from(communityQuestions).where(eq(communityQuestions.authorId, userId)).orderBy(desc(communityQuestions.createdAt)).limit(100);

/** Published community questions per topic (for the practice page's opt-in toggles). */
export async function publishedCountsByTopic() {
  const rows = await db.select({ topic: communityQuestions.topic, n: count() }).from(communityQuestions).where(eq(communityQuestions.status, "PUBLISHED")).groupBy(communityQuestions.topic);
  return new Map(rows.map((r) => [r.topic, r.n]));
}

export async function statusCounts() {
  const rows = await db.select({ status: communityQuestions.status, n: count() }).from(communityQuestions).groupBy(communityQuestions.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<(typeof communityQuestions.$inferSelect)["status"], number>>;
}

export async function queue(status: (typeof communityQuestions.$inferSelect)["status"]) {
  return db
    .select({ q: communityQuestions, author: users.name })
    .from(communityQuestions)
    .innerJoin(users, eq(users.id, communityQuestions.authorId))
    .where(eq(communityQuestions.status, status))
    .orderBy(status === "FLAGGED_DUPLICATE" ? desc(communityQuestions.bestMatchScore) : desc(communityQuestions.createdAt))
    .limit(100);
}
