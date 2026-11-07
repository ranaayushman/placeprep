import "server-only";
import { db, events } from "@/db";
import { requestInfo } from "./request-info";

export type EventType =
  | "register"
  | "email_verified"
  | "login"
  | "login_failed"
  | "login_blocked"
  | "logout"
  | "mock_started"
  | "mock_submitted"
  | "practice_started"
  | "violation"
  | "camera_alert"
  | "rate_limited"
  | "question_submitted"
  | "question_flagged"
  | "question_approved"
  | "question_rejected"
  | "question_reported";

/** Best-effort: logging must never break the user's request. */
export async function logEvent(
  type: EventType,
  opts: { userId?: string | null; attemptId?: string; meta?: Record<string, unknown>; withRequest?: boolean } = {},
) {
  try {
    const info = opts.withRequest === false ? { ip: null, userAgent: null } : await requestInfo().catch(() => ({ ip: null, userAgent: null }));
    await db.insert(events).values({
      type,
      userId: opts.userId ?? null,
      attemptId: opts.attemptId,
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
      ...info,
    });
  } catch (err) {
    console.error("logEvent failed", err);
  }
}
