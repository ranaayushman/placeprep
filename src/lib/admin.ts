import "server-only";
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
      AND a.started_at >= ${now - 3 * 60 * MIN} -- a full mock is ~2 h; older ones are abandoned
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
      filter === "admins" ? sql`u.role = 'ADMIN'` : undefined,
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

export const EVENT_TYPES = ["login", "login_failed", "login_blocked", "register", "email_verified", "logout", "mock_started", "mock_submitted", "practice_started", "violation", "rate_limited", "question_submitted", "question_flagged", "question_approved", "question_rejected", "question_reported"] as const;

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
      return `Submitted mock: ${meta?.score}/${meta?.maxScore}${meta?.autoSubmitted ? " (auto-submitted after warnings)" : ""}`;
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
