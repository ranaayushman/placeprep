import { sql } from "drizzle-orm";
import { boolean, customType, index, integer, jsonb, pgTable, primaryKey, real, text, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Timestamps are epoch milliseconds in a bigint column, read as Date. Raw SQL in lib/admin.ts and
 * lib/analytics.ts compares them with plain numbers (Date.now() - …), so keep them numeric.
 */
const ms = customType<{ data: Date; driverData: string | number }>({
  dataType: () => "bigint",
  toDriver: (d) => d.getTime(),
  fromDriver: (v) => new Date(Number(v)),
});
const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const now = (name: string) =>
  ms(name).notNull().default(sql`(extract(epoch from now()) * 1000)::bigint`);

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    /** Null for accounts created with Google that never set a password. */
    passwordHash: text("password_hash"),
    googleId: text("google_id").unique(),
    /** Profile collected during onboarding. onboardedAt = null means onboarding not finished. */
    college: text("college"),
    degree: text("degree"),
    branch: text("branch"),
    passoutYear: integer("passout_year"),
    dreamCompany: text("dream_company"),
    onboardedAt: ms("onboarded_at"),
    role: text("role", { enum: ["STUDENT", "ADMIN"] }).notNull().default("STUDENT"),
    /** Non-null = blocked. Blocked users cannot log in and all their sessions are revoked. */
    blockedAt: ms("blocked_at"),
    blockedReason: text("blocked_reason"),
    blockedBy: text("blocked_by"),
    /** Updated at most once a minute per user (see auth.ts), used for "active now" in the admin panel. */
    lastSeenAt: ms("last_seen_at"),
    /** When the student ticked "send me emails" (proof of consent). Null = never opted in. */
    marketingOptInAt: ms("marketing_opt_in_at"),
    createdAt: now("created_at"),
  },
  (t) => [index("users_last_seen_idx").on(t.lastSeenAt), index("users_blocked_idx").on(t.blockedAt)],
);

/**
 * Append-only behaviour log: logins, failed logins, proctoring violations, test starts/submits.
 * Powers the admin panel's monitoring views.
 */
export const events = pgTable(
  "events",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    attemptId: text("attempt_id"),
    meta: text("meta"), // small JSON blob
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: now("created_at"),
  },
  (t) => [index("events_user_idx").on(t.userId, t.createdAt), index("events_type_idx").on(t.type, t.createdAt)],
);

/** Audit trail of every admin action (block, unblock, revoke sessions, role changes). */
export const adminActions = pgTable(
  "admin_actions",
  {
    id: id(),
    adminId: text("admin_id").notNull().references(() => users.id),
    targetUserId: text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    reason: text("reason"),
    createdAt: now("created_at"),
  },
  (t) => [index("admin_actions_target_idx").on(t.targetUserId, t.createdAt)],
);

/** The cookie holds a random token; only its SHA-256 hash is stored here. */
export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ms("expires_at").notNull(),
    createdAt: now("created_at"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** One mock test or one practice set. */
export const attempts = pgTable(
  "attempts",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    mode: text("mode", { enum: ["MOCK", "PRACTICE"] }).notNull(),
    status: text("status", { enum: ["IN_PROGRESS", "SUBMITTED"] }).notNull().default("IN_PROGRESS"),
    title: text("title").notNull(),
    /** Which company exam a MOCK follows (lib/exam/pattern.ts EXAMS); null for practice. */
    exam: text("exam"),
    currentSection: integer("current_section").notNull().default(0),
    /** Counter only; the individual violations live in `events` (type = "violation"). */
    violations: integer("violations").notNull().default(0),
    autoSubmitted: boolean("auto_submitted").notNull().default(false),
    /** MOCK only: the student turned camera proctoring off in the system check. */
    cameraOff: boolean("camera_off").notNull().default(false),
    /** Face not visible / looking away / another face. Shown to the student; never ends the test. */
    cameraAlerts: integer("camera_alerts").notNull().default(0),
    score: integer("score"),
    maxScore: integer("max_score"),
    startedAt: now("started_at"),
    submittedAt: ms("submitted_at"),
  },
  (t) => [index("attempts_user_idx").on(t.userId, t.mode, t.status), index("attempts_status_idx").on(t.status, t.mode)],
);

export const attemptSections = pgTable(
  "attempt_sections",
  {
    id: id(),
    attemptId: text("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    order: integer("order").notNull(),
    /** 0 = untimed (practice) */
    durationSec: integer("duration_sec").notNull(),
    startedAt: ms("started_at"),
    endedAt: ms("ended_at"),
  },
  (t) => [uniqueIndex("attempt_sections_order_uq").on(t.attemptId, t.order)],
);

export const attemptQuestions = pgTable(
  "attempt_questions",
  {
    id: id(),
    attemptId: text("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
    sectionOrder: integer("section_order").notNull(),
    order: integer("order").notNull(),
    section: text("section").notNull(),
    topic: text("topic").notNull(),
    /** "<topicId>:<seed>" — regenerates exactly the same question. */
    ref: text("ref").notNull(),
    /** JSON snapshot of what the candidate sees (never contains the answer). */
    payload: text("payload").notNull(),
    /** -1 for essay questions. Never sent to the client during a mock. */
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation").notNull(),
    chosenIndex: integer("chosen_index"),
    textAnswer: text("text_answer"),
    isCorrect: boolean("is_correct"),
    marked: boolean("marked").notNull().default(false),
    timeSpentMs: integer("time_spent_ms").notNull().default(0),
    answeredAt: ms("answered_at"),
  },
  (t) => [
    uniqueIndex("attempt_questions_pos_uq").on(t.attemptId, t.sectionOrder, t.order),
    index("attempt_questions_topic_idx").on(t.topic),
    index("attempt_questions_answered_idx").on(t.attemptId, t.answeredAt),
  ],
);

// ---------------------------------------------------------------------------------------------
// Community questions (see README "Community questions" and src/lib/community).

export const COMMUNITY_STATUSES = ["PENDING_REVIEW", "FLAGGED_DUPLICATE", "PUBLISHED", "REJECTED", "NEEDS_REVIEW"] as const;

export const communityQuestions = pgTable(
  "community_questions",
  {
    id: id(),
    authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    topic: text("topic").notNull(),
    company: text("company").notNull(),
    year: integer("year"),
    stem: text("stem").notNull(),
    code: text("code"),
    options: jsonb("options").$type<string[]>().notNull(),
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation").notNull(),
    sourceType: text("source_type", { enum: ["ORIGINAL", "MEMORY_BASED_PYQ", "OTHER"] }).notNull(),
    status: text("status", { enum: COMMUNITY_STATUSES }).notNull(),
    bestMatchScore: real("best_match_score").notNull().default(0),
    /** Set when an admin marks it a duplicate: a fingerprint ref ("v-fill:3" or "community:<id>"). */
    duplicateOfRef: text("duplicate_of_ref"),
    /** Shown to the uploader. */
    rejectionReason: text("rejection_reason"),
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: ms("reviewed_at"),
    normStem: text("norm_stem").notNull(),
    normOptions: text("norm_options").notNull(),
    createdAt: now("created_at"),
    updatedAt: now("updated_at"),
  },
  (t) => [
    index("community_status_idx").on(t.status, t.createdAt),
    index("community_topic_idx").on(t.section, t.topic, t.status),
    index("community_author_idx").on(t.authorId),
  ],
);

/**
 * Normalised text of every comparable question: static bank items ("<topicId>:<index>") and live
 * community submissions ("community:<id>"). Trigram indexes on both text columns (migration 0005).
 */
export const questionFingerprints = pgTable(
  "question_fingerprints",
  {
    ref: text("ref").primaryKey(),
    section: text("section").notNull(),
    topic: text("topic").notNull(),
    normStem: text("norm_stem").notNull(),
    normOptions: text("norm_options").notNull(),
    source: text("source", { enum: ["BANK", "COMMUNITY"] }).notNull(),
  },
  (t) => [index("fingerprints_section_idx").on(t.section)],
);

export const submissionMatches = pgTable(
  "submission_matches",
  {
    submissionId: text("submission_id").notNull().references(() => communityQuestions.id, { onDelete: "cascade" }),
    matchedRef: text("matched_ref").notNull(),
    score: real("score").notNull(),
    stemScore: real("stem_score").notNull(),
    optionsScore: real("options_score").notNull(),
  },
  (t) => [primaryKey({ columns: [t.submissionId, t.matchedRef] })],
);

export const questionReports = pgTable(
  "question_reports",
  {
    id: id(),
    questionId: text("question_id").notNull().references(() => communityQuestions.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason", { enum: ["WRONG_ANSWER", "UNCLEAR", "COPIED", "OTHER"] }).notNull(),
    details: text("details"),
    status: text("status", { enum: ["OPEN", "RESOLVED"] }).notNull().default("OPEN"),
    createdAt: now("created_at"),
  },
  (t) => [uniqueIndex("question_reports_once_uq").on(t.questionId, t.userId), index("question_reports_open_idx").on(t.questionId, t.status)],
);

export type User = typeof users.$inferSelect;
/** In-product updates posted by admins, shown to every student under the navbar bell. */
export const announcements = pgTable("announcements", {
  id: id(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: now("created_at"),
});

export type CommunityQuestion = typeof communityQuestions.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type AttemptSection = typeof attemptSections.$inferSelect;
export type AttemptQuestion = typeof attemptQuestions.$inferSelect;
export type Event = typeof events.$inferSelect;
