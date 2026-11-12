import "server-only";
import { LEFT_AFTER_MS } from "@/lib/exam/pattern";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { SECTION_LABELS, type SectionId } from "@/lib/questions";

const MIN = 60_000;
const DAY = 86_400_000;
export const FLAG_VIOLATIONS_7D = 3;
export const PAGE_SIZE = 25;

const n = (v: unknown) => Number(v ?? 0);

export async function adminOverview() {
  const now = Date.now();
  const [counts] = await db.execute<Record<string, number>>(sql`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') AS students,
      (SELECT COUNT(*) FROM users WHERE role = 'STUDENT' AND created_at >= ${now - 7 * DAY}) AS new7d,
      (SELECT COUNT(*) FROM users WHERE last_seen_at >= ${now - DAY}) AS active24h,
      (SELECT COUNT(*) FROM users WHERE last_seen_at >= ${now - 5 * MIN}) AS online,
      (SELECT COUNT(*) FROM users WHERE blocked_at IS NOT NULL) AS blocked,
      (SELECT COUNT(*) FROM attempts WHERE mode = 'MOCK' AND submitted_at >= ${now - DAY}) AS mocks24h,
      (SELECT COUNT(*) FROM attempt_questions WHERE answered_at >= ${now - DAY}) AS answers24h,
      (SELECT COUNT(*) FROM events WHERE type = 'violation' AND created_at >= ${now - DAY}) AS violations24h,
      (SELECT COUNT(*) FROM events WHERE type = 'login_failed' AND created_at >= ${now - DAY}) AS "failedLogins24h"`);

  const live = await db.execute<{ id: string; user_id: string; name: string; email: string; title: string; current_section: number; section: string | null; violations: number; started_at: number }>(sql`
    SELECT a.id, a.user_id, u.name, u.email, a.title, a.current_section, s.section, a.violations, a.started_at
    FROM attempts a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN attempt_sections s ON s.attempt_id = a.id AND s."order" = a.current_section
    WHERE a.mode = 'MOCK' AND a.status = 'IN_PROGRESS' AND u.blocked_at IS NULL
      AND COALESCE(a.last_active_at, a.started_at) >= ${now - LEFT_AFTER_MS} -- quieter ones were left
    ORDER BY a.violations DESC, a.started_at DESC
    LIMIT 50`);

  const signups = await db.execute<{ day: string; c: number }>(sql`
    SELECT to_char(to_timestamp(created_at / 1000 + 19800) AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*) AS c
    FROM users WHERE created_at >= ${now - 14 * DAY} GROUP BY day`);
  const byDay = new Map(signups.map((r) => [r.day, n(r.c)]));
  const signupSeries = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(now + 19_800_000 - (13 - i) * DAY).toISOString().slice(0, 10);
    return { day, c: byDay.get(day) ?? 0 };
  });

  return {
    counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, n(v)])) as Record<string, number>,
    live: live.map((l) => ({ ...l, sectionLabel: l.section ? SECTION_LABELS[l.section as SectionId] : "—", startedAt: new Date(n(l.started_at)) })),
    flagged: await flaggedUsers(),
    signupSeries,
  };
}

/** Students whose proctoring behaviour in the last 7 days looks suspicious. */
export async function flaggedUsers() {
  const since = Date.now() - 7 * DAY;
  const rows = await db.execute<{ id: string; name: string; email: string; v7d: number; auto7d: number; blocked_at: number | null; last_violation: number }>(sql`
    SELECT * FROM (
    SELECT u.id, u.name, u.email, u.blocked_at,
           COUNT(e.id) AS v7d,
           (SELECT COUNT(*) FROM attempts a WHERE a.user_id = u.id AND a.auto_submitted AND a.submitted_at >= ${since}) AS auto7d,
           MAX(e.created_at) AS last_violation
    FROM users u JOIN events e ON e.user_id = u.id AND e.type = 'violation' AND e.created_at >= ${since}
    GROUP BY u.id
    ) f WHERE v7d >= ${FLAG_VIOLATIONS_7D} OR auto7d > 0
    ORDER BY v7d DESC
    LIMIT 50`);
  return rows.map((r) => ({ ...r, v7d: n(r.v7d), auto7d: n(r.auto7d), lastViolation: new Date(n(r.last_violation)) }));
}

export type UserFilter = "all" | "active" | "blocked" | "flagged" | "admins";

export async function listUsers({ q = "", filter = "all" as UserFilter, page = 1 }) {
  const since7d = Date.now() - 7 * DAY;
  const like = `%${q.trim().toLowerCase()}%`;
  const where = sql.join(
    [
      sql`1 = 1`,
      q.trim() ? sql`(lower(u.name) LIKE ${like} OR lower(u.email) LIKE ${like})` : undefined,
      filter === "blocked" ? sql`u.blocked_at IS NOT NULL` : undefined,
      filter === "admins" ? sql`u.role <> 'STUDENT'` : undefined,
      filter === "active" ? sql`u.last_seen_at >= ${Date.now() - DAY}` : undefined,
      filter === "flagged"
        ? sql`(SELECT COUNT(*) FROM events e WHERE e.user_id = u.id AND e.type = 'violation' AND e.created_at >= ${since7d}) >= ${FLAG_VIOLATIONS_7D}`
        : undefined,
    ].filter(Boolean) as ReturnType<typeof sql>[],
    sql` AND `,
  );

  const [{ total }] = await db.execute<{ total: number }>(sql`SELECT COUNT(*) AS total FROM users u WHERE ${where}`);
  const rows = await db.execute<{
    id: string; name: string; email: string; role: string; created_at: number; last_seen_at: number | null; blocked_at: number | null;
    answered: number; mocks: number; avg_mock: number | null; violations: number;
  }>(sql`
    SELECT u.id, u.name, u.email, u.role, u.created_at, u.last_seen_at, u.blocked_at,
      (SELECT COUNT(*) FROM attempt_questions q JOIN attempts a ON a.id = q.attempt_id
         WHERE a.user_id = u.id AND q.chosen_index IS NOT NULL) AS answered,
      (SELECT COUNT(*) FROM attempts a WHERE a.user_id = u.id AND a.mode = 'MOCK' AND a.status = 'SUBMITTED') AS mocks,
      (SELECT AVG(CAST(a.score AS REAL) / a.max_score) FROM attempts a
         WHERE a.user_id = u.id AND a.mode = 'MOCK' AND a.status = 'SUBMITTED' AND a.max_score > 0) AS avg_mock,
      (SELECT COALESCE(SUM(a.violations), 0) FROM attempts a WHERE a.user_id = u.id) AS violations
    FROM users u
    WHERE ${where}
    ORDER BY COALESCE(u.last_seen_at, u.created_at) DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(Math.max(1, page) - 1) * PAGE_SIZE}`);

  return {
    total: n(total),
    pages: Math.max(1, Math.ceil(n(total) / PAGE_SIZE)),
    rows: rows.map((r) => ({
      ...r,
      answered: n(r.answered),
      mocks: n(r.mocks),
      violations: n(r.violations),
      createdAt: new Date(n(r.created_at)),
      lastSeenAt: r.last_seen_at ? new Date(n(r.last_seen_at)) : null,
      blocked: r.blocked_at != null,
    })),
  };
}

export async function userDetail(userId: string) {
  const [user] = await db.execute<{
    id: string; name: string; email: string; role: string; created_at: number; last_seen_at: number | null;
    blocked_at: number | null; blocked_reason: string | null; blocked_by_name: string | null; sessions: number;
    college: string | null; degree: string | null; branch: string | null; passout_year: number | null; dream_company: string | null; google: boolean;
  }>(sql`
    SELECT u.id, u.name, u.email, u.role, u.created_at, u.last_seen_at, u.blocked_at, u.blocked_reason,
           u.college, u.degree, u.branch, u.passout_year, u.dream_company, u.google_id IS NOT NULL AS google,
           b.name AS blocked_by_name,
           (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > ${Date.now()}) AS sessions
    FROM users u LEFT JOIN users b ON b.id = u.blocked_by
    WHERE u.id = ${userId}`);
  if (!user) return null;

  const [attemptRows, eventRows, actionRows, ipRows] = await Promise.all([
    db.execute<{ id: string; mode: string; title: string; status: string; score: number | null; max_score: number | null; violations: number; auto_submitted: boolean; camera_off: boolean; camera_alerts: number; started_at: number; submitted_at: number | null }>(sql`
      SELECT id, mode, title, status, score, max_score, violations, auto_submitted, camera_off, camera_alerts, started_at, submitted_at
      FROM attempts WHERE user_id = ${userId} ORDER BY started_at DESC LIMIT 50`),
    db.execute<{ id: string; type: string; meta: string | null; ip: string | null; user_agent: string | null; created_at: number; attempt_id: string | null }>(sql`
      SELECT id, type, meta, ip, user_agent, created_at, attempt_id
      FROM events WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 100`),
    db.execute<{ action: string; reason: string | null; created_at: number; admin_name: string }>(sql`
      SELECT aa.action, aa.reason, aa.created_at, COALESCE(u.name, 'a deleted admin') AS admin_name
      FROM admin_actions aa LEFT JOIN users u ON u.id = aa.admin_id
      WHERE aa.target_user_id = ${userId} ORDER BY aa.created_at DESC LIMIT 50`),
    // Distinct IPs used to log in — several accounts from one IP or many IPs can indicate sharing.
    db.execute<{ ip: string; c: number; last: number }>(sql`
      SELECT ip, COUNT(*) AS c, MAX(created_at) AS last FROM events
      WHERE user_id = ${userId} AND type IN ('login', 'register') AND ip IS NOT NULL
      GROUP BY ip ORDER BY last DESC LIMIT 10`),
  ]);

  return {
    user: {
      ...user,
      createdAt: new Date(n(user.created_at)),
      lastSeenAt: user.last_seen_at ? new Date(n(user.last_seen_at)) : null,
      blockedAt: user.blocked_at ? new Date(n(user.blocked_at)) : null,
      sessions: n(user.sessions),
    },
    attempts: attemptRows.map((a) => ({ ...a, startedAt: new Date(n(a.started_at)), submittedAt: a.submitted_at ? new Date(n(a.submitted_at)) : null })),
    events: eventRows.map((e) => ({ ...e, createdAt: new Date(n(e.created_at)), meta: e.meta ? (JSON.parse(e.meta) as Record<string, unknown>) : null })),
    actions: actionRows.map((a) => ({ ...a, createdAt: new Date(n(a.created_at)) })),
    ips: ipRows.map((r) => ({ ip: r.ip, count: n(r.c), last: new Date(n(r.last)) })),
  };
}

export async function blockedList() {
  const rows = await db.execute<{ id: string; name: string; email: string; blocked_at: number; blocked_reason: string | null; blocked_by_name: string | null }>(sql`
    SELECT u.id, u.name, u.email, u.blocked_at, u.blocked_reason, b.name AS blocked_by_name
    FROM users u LEFT JOIN users b ON b.id = u.blocked_by
    WHERE u.blocked_at IS NOT NULL ORDER BY u.blocked_at DESC`);
  return rows.map((r) => ({ ...r, blockedAt: new Date(n(r.blocked_at)) }));
}

export const EVENT_TYPES = ["login", "login_failed", "login_blocked", "register", "email_verified", "logout", "password_changed", "deletion_requested", "mock_started", "mock_submitted", "practice_started", "violation", "rate_limited", "question_submitted", "question_flagged", "question_approved", "question_rejected", "question_reported"] as const;

export async function activityFeed({ type, page = 1 }: { type?: string; page?: number }) {
  const where = type && (EVENT_TYPES as readonly string[]).includes(type) ? sql`e.type = ${type}` : sql`1 = 1`;
  const rows = await db.execute<{ id: string; type: string; meta: string | null; ip: string | null; created_at: number; user_id: string | null; name: string | null; email: string | null }>(sql`
    SELECT e.id, e.type, e.meta, e.ip, e.created_at, e.user_id, u.name, u.email
    FROM events e LEFT JOIN users u ON u.id = e.user_id
    WHERE ${where}
    ORDER BY e.created_at DESC
    LIMIT ${PAGE_SIZE * 2} OFFSET ${(Math.max(1, page) - 1) * PAGE_SIZE * 2}`);
  return rows.map((r) => ({ ...r, createdAt: new Date(n(r.created_at)), meta: r.meta ? (JSON.parse(r.meta) as Record<string, unknown>) : null }));
}

export function describeEvent(type: string, meta: Record<string, unknown> | null) {
  switch (type) {
    case "camera_alert":
      return `Camera alert #${meta?.count ?? "?"}: ${String(meta?.type ?? "").replace("-", " ")} (not a warning)`;
    case "violation":
      return `Proctoring warning #${meta?.count ?? "?"}: ${String(meta?.type ?? "").replace("-", " ")}`;
    case "mock_submitted":
      return `Submitted mock: ${meta?.score}/${meta?.maxScore}${meta?.autoSubmitted ? " (auto-submitted: warnings or left the test)" : ""}`;
    case "mock_started":
    case "practice_started":
      return `Started ${meta?.title ?? "a test"}`;
    case "login_failed":
      return `Failed login${meta?.email ? ` for ${meta.email}` : ""}`;
    case "login_blocked":
      return "Login attempt while blocked";
    case "rate_limited":
      return `Rate-limited (${meta?.action ?? "request"})`;
    default:
      return type.replace("_", " ");
  }
}

export type LeaderRow = {
  rank: number | null; id: string; name: string; email: string; college: string | null;
  mocks: number; avgPct: number | null; bestPct: number | null; lastMockAt: Date | null;
  /** Average seconds per answered mock question. */
  mockSecPerQ: number | null;
  practiceAnswered: number; practiceAcc: number | null;
  /** Every answered question, mocks and practice, finished or not; accuracy over the graded ones. */
  totalAnswered: number; totalAcc: number | null;
};

export type LeaderSort = "score" | "attempted";

/**
 * by "score": students who finished at least one test, ranked by average mock score (best mock breaks
 * ties); practice-only students come after, unranked. `exam` limits it to one mock pattern's takers.
 * by "attempted": everyone who answered at least one question, ranked by how many they answered
 * (mocks and practice, all exams); `exam` is ignored.
 */
// shortcut: top 500 only, computed on every load; add paging or a cached table past a few thousand students.
export async function leaderboard(exam?: string, by: LeaderSort = "score"): Promise<LeaderRow[]> {
  if (by === "attempted") exam = undefined;
  const examFilter = exam ? sql`AND exam = ${exam}` : sql``;
  const rows = await db.execute<{
    id: string; name: string; email: string; college: string | null; mocks: number | null; avg_pct: number | null; best_pct: number | null;
    last_at: number | null; answered: number | null; acc: number | null; rnk: number | null; sec_per_q: number | null;
    total_answered: number | null; total_acc: number | null;
  }>(sql`
    WITH m AS (
      SELECT user_id, COUNT(*) AS mocks, AVG(score::float / NULLIF(max_score, 0)) AS avg_pct,
             MAX(score::float / NULLIF(max_score, 0)) AS best_pct, MAX(submitted_at) AS last_at
      FROM attempts WHERE mode = 'MOCK' AND status = 'SUBMITTED' ${examFilter}
      GROUP BY user_id
    ), sp AS (
      SELECT a.user_id, AVG(q.time_spent_ms) FILTER (WHERE q.chosen_index IS NOT NULL AND q.time_spent_ms > 0) / 1000.0 AS sec_per_q
      FROM attempts a JOIN attempt_questions q ON q.attempt_id = a.id AND q.answer_index >= 0
      WHERE a.mode = 'MOCK' AND a.status = 'SUBMITTED' ${exam ? sql`AND a.exam = ${exam}` : sql``}
      GROUP BY a.user_id
    ), p AS (
      SELECT a.user_id, COUNT(*) FILTER (WHERE q.chosen_index IS NOT NULL) AS answered,
             AVG(CASE WHEN q.is_correct THEN 1.0 ELSE 0 END) FILTER (WHERE q.is_correct IS NOT NULL) AS acc
      FROM attempts a JOIN attempt_questions q ON q.attempt_id = a.id
      WHERE a.mode = 'PRACTICE' AND a.status = 'SUBMITTED'
      GROUP BY a.user_id
    ), t AS (
      SELECT a.user_id, COUNT(*) AS answered,
             AVG(CASE WHEN q.is_correct THEN 1.0 ELSE 0 END) FILTER (WHERE q.is_correct IS NOT NULL) AS acc
      FROM attempts a JOIN attempt_questions q ON q.attempt_id = a.id
      WHERE q.chosen_index IS NOT NULL
      GROUP BY a.user_id
    )
    SELECT u.id, u.name, u.email, u.college, m.mocks, m.avg_pct, m.best_pct, m.last_at, p.answered, p.acc, sp.sec_per_q,
           t.answered AS total_answered, t.acc AS total_acc,
           ${by === "attempted"
             ? sql`RANK() OVER (ORDER BY t.answered DESC)`
             : sql`CASE WHEN m.user_id IS NOT NULL THEN RANK() OVER (ORDER BY m.user_id IS NULL, m.avg_pct DESC NULLS LAST, m.best_pct DESC NULLS LAST) END`} AS rnk
    FROM users u
    LEFT JOIN m ON m.user_id = u.id
    LEFT JOIN p ON p.user_id = u.id
    LEFT JOIN sp ON sp.user_id = u.id
    LEFT JOIN t ON t.user_id = u.id
    WHERE u.role <> 'ADMIN' AND ${by === "attempted" ? sql`t.user_id IS NOT NULL` : sql`(m.user_id IS NOT NULL ${exam ? sql`` : sql`OR p.user_id IS NOT NULL`})`}
    ORDER BY ${by === "attempted"
      ? sql`t.answered DESC, u.name`
      : sql`m.user_id IS NULL, m.avg_pct DESC NULLS LAST, m.best_pct DESC NULLS LAST, p.answered DESC NULLS LAST, u.name`}
    LIMIT 500`);
  return rows.map((r) => ({
    rank: r.rnk == null ? null : n(r.rnk), id: r.id, name: r.name, email: r.email, college: r.college,
    mocks: n(r.mocks), avgPct: r.avg_pct == null ? null : Number(r.avg_pct), bestPct: r.best_pct == null ? null : Number(r.best_pct),
    lastMockAt: r.last_at ? new Date(n(r.last_at)) : null, mockSecPerQ: r.sec_per_q == null ? null : Number(r.sec_per_q), practiceAnswered: n(r.answered), practiceAcc: r.acc == null ? null : Number(r.acc),
    totalAnswered: n(r.total_answered), totalAcc: r.total_acc == null ? null : Number(r.total_acc),
  }));
}

export type FunnelStep = { label: string; n: number };

/**
 * Where students drop off, for students who signed up since `since` (0 = all time). Steps 2–5 each
 * require the step before, so the numbers never go up. "Came back" (seen on a later day) is separate.
 */
export async function signupFunnel(since: number): Promise<FunnelStep[]> {
  const [r] = await db.execute<{ signed: number; onboarded: number; practised: number; finished: number; mocked: number; returned: number }>(sql`
    WITH s AS (
      SELECT u.onboarded_at IS NOT NULL AS ob,
             EXISTS (SELECT 1 FROM attempts a WHERE a.user_id = u.id) AS started,
             EXISTS (SELECT 1 FROM attempts a WHERE a.user_id = u.id AND a.status = 'SUBMITTED') AS finished,
             EXISTS (SELECT 1 FROM attempts a WHERE a.user_id = u.id AND a.mode = 'MOCK' AND a.status = 'SUBMITTED') AS mocked,
             u.last_seen_at >= u.created_at + ${DAY} AS returned
      FROM users u WHERE u.role = 'STUDENT' AND u.created_at >= ${since}
    )
    SELECT COUNT(*) AS signed,
           COUNT(*) FILTER (WHERE ob) AS onboarded,
           COUNT(*) FILTER (WHERE ob AND started) AS practised,
           COUNT(*) FILTER (WHERE ob AND started AND finished) AS finished,
           COUNT(*) FILTER (WHERE ob AND started AND finished AND mocked) AS mocked,
           COUNT(*) FILTER (WHERE returned) AS returned
    FROM s`);
  return [
    { label: "Signed up", n: n(r.signed) },
    { label: "Finished onboarding", n: n(r.onboarded) },
    { label: "Started a test", n: n(r.practised) },
    { label: "Finished a test", n: n(r.finished) },
    { label: "Finished a mock", n: n(r.mocked) },
    { label: "Came back another day", n: n(r.returned) },
  ];
}

export type GrowthDay = { day: string; signups: number; active: number };

/** Per IST day, oldest first: student sign-ups, and distinct students who started any test. Missing days are 0. */
export async function dailyGrowth(days = 30): Promise<GrowthDay[]> {
  const IST = 330 * 60; // seconds
  const dayOf = (i: number) => new Date(Date.now() + IST * 1000 - (days - 1 - i) * DAY).toISOString().slice(0, 10);
  const since = Date.parse(`${dayOf(0)}T00:00:00+05:30`); // whole first day, not a partial one
  const rows = await db.execute<{ day: string; signups: number; active: number }>(sql`
    WITH d AS (
      SELECT to_char(to_timestamp(created_at / 1000 + ${IST}) AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, id AS signup, NULL AS active
      FROM users WHERE role = 'STUDENT' AND created_at >= ${since}
      UNION ALL
      SELECT to_char(to_timestamp(a.started_at / 1000 + ${IST}) AT TIME ZONE 'UTC', 'YYYY-MM-DD'), NULL, a.user_id
      FROM attempts a JOIN users u ON u.id = a.user_id AND u.role = 'STUDENT' WHERE a.started_at >= ${since}
    )
    SELECT day, COUNT(DISTINCT signup) AS signups, COUNT(DISTINCT active) AS active FROM d GROUP BY day`);
  const by = new Map(rows.map((r) => [r.day, r]));
  return Array.from({ length: days }, (_, i) => {
    const day = dayOf(i);
    const r = by.get(day);
    return { day, signups: Number(r?.signups ?? 0), active: Number(r?.active ?? 0) };
  });
}

export type Cohort = { weekStart: Date; size: number; weeks: (number | null)[] };

/**
 * Weekly sign-up cohorts (IST weeks, Monday start) for the last `count` weeks. weeks[k] = students
 * who started any test in their (k+1)th week after signing up; null while that week isn't over for everyone.
 */
export async function retentionCohorts(count = 8, followWeeks = 4): Promise<Cohort[]> {
  const WEEK = 7 * DAY;
  const now = Date.now();
  const rows = await db.execute<{ wk: number; size: number; w1: number; w2: number; w3: number; w4: number }>(sql`
    WITH s AS (
      SELECT id, created_at,
             (extract(epoch from date_trunc('week', to_timestamp(created_at / 1000) AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata') * 1000)::bigint AS wk
      FROM users WHERE role = 'STUDENT' AND created_at >= ${now - (count + 1) * WEEK}
    ), act AS (
      SELECT DISTINCT s.id, floor((a.started_at - s.created_at)::float / ${WEEK})::int AS w
      FROM s JOIN attempts a ON a.user_id = s.id AND a.started_at >= s.created_at
    )
    SELECT s.wk, COUNT(DISTINCT s.id) AS size,
           COUNT(DISTINCT act.id) FILTER (WHERE act.w = 1) AS w1, COUNT(DISTINCT act.id) FILTER (WHERE act.w = 2) AS w2,
           COUNT(DISTINCT act.id) FILTER (WHERE act.w = 3) AS w3, COUNT(DISTINCT act.id) FILTER (WHERE act.w = 4) AS w4
    FROM s LEFT JOIN act ON act.id = s.id
    GROUP BY s.wk ORDER BY s.wk DESC LIMIT ${count}`);
  return rows.map((r) => {
    const weekStart = n(r.wk);
    // Week k is over for the whole cohort once its last sign-up (end of the cohort week) is k+1 weeks old.
    const weeks = [r.w1, r.w2, r.w3, r.w4].slice(0, followWeeks).map((v, k) => (now >= weekStart + WEEK + (k + 2) * WEEK ? n(v) : null));
    return { weekStart: new Date(weekStart), size: n(r.size), weeks };
  });
}

export const SUBMISSION_WINDOWS = { "24h": DAY, "7d": 7 * DAY, "30d": 30 * DAY, all: 0 } as const;
export type SubmissionWindow = keyof typeof SUBMISSION_WINDOWS;

/** Every finished mock, newest first: who, which exam, score, warnings, how it ended. */
export async function submittedMocks({ window = "all", exam, page = 1 }: { window?: SubmissionWindow; exam?: string; page?: number }) {
  const span = SUBMISSION_WINDOWS[window];
  const where = sql`a.mode = 'MOCK' AND a.status = 'SUBMITTED'
    ${span ? sql`AND a.submitted_at >= ${Date.now() - span}` : sql``}
    ${exam ? sql`AND a.exam = ${exam}` : sql``}`;
  const [rows, [{ total }]] = await Promise.all([
    db.execute<{ id: string; user_id: string; name: string; email: string; title: string; exam: string | null; score: number | null; max_score: number | null; violations: number; camera_alerts: number; auto_submitted: boolean; started_at: number; submitted_at: number }>(sql`
      SELECT a.id, a.user_id, u.name, u.email, a.title, a.exam, a.score, a.max_score, a.violations, a.camera_alerts, a.auto_submitted, a.started_at, a.submitted_at
      FROM attempts a JOIN users u ON u.id = a.user_id
      WHERE ${where}
      ORDER BY a.submitted_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${(Math.max(1, page) - 1) * PAGE_SIZE}`),
    db.execute<{ total: number }>(sql`SELECT COUNT(*) AS total FROM attempts a WHERE ${where}`),
  ]);
  return {
    total: n(total),
    pages: Math.max(1, Math.ceil(n(total) / PAGE_SIZE)),
    rows: rows.map((r) => ({
      id: r.id, userId: r.user_id, name: r.name, email: r.email, title: r.title, exam: r.exam,
      score: n(r.score), maxScore: n(r.max_score), violations: n(r.violations), cameraAlerts: n(r.camera_alerts), autoSubmitted: !!r.auto_submitted,
      startedAt: new Date(n(r.started_at)), submittedAt: new Date(n(r.submitted_at)),
    })),
  };
}
