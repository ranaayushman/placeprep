import "server-only";
import { lt, sql } from "drizzle-orm";
import { appErrors, db } from "@/db";

const KEEP_DAYS = 30;
const clip = (s: unknown, n: number) => (typeof s === "string" && s ? s.slice(0, n) : null);

/** Records one error. Never throws: error logging must not cause another error. */
export async function recordError(e: { source: "client" | "server"; message: unknown; stack?: unknown; digest?: unknown; path?: unknown; userAgent?: unknown; userId?: string | null }) {
  try {
    await db.insert(appErrors).values({
      source: e.source,
      message: clip(e.message, 1000) ?? "(no message)",
      stack: clip(e.stack, 4000),
      digest: clip(e.digest, 100),
      path: clip(e.path, 500),
      userAgent: clip(e.userAgent, 300),
      userId: e.userId ?? null,
    });
    if (Math.random() < 0.02) await db.delete(appErrors).where(lt(appErrors.createdAt, new Date(Date.now() - KEEP_DAYS * 86_400_000)));
  } catch (err) {
    console.error("[app-errors] could not record:", err);
  }
}

export type ErrorGroup = { source: string; message: string; count: number; users: number; lastAt: Date; firstAt: Date; path: string | null; digest: string | null; stack: string | null; userAgent: string | null };

/** The same error from many students shows once, with how often and how many people hit it. */
export async function errorGroups(days = 7): Promise<ErrorGroup[]> {
  const rows = await db.execute<{ source: string; message: string; count: number; users: number; last_at: number; first_at: number; path: string | null; digest: string | null; stack: string | null; user_agent: string | null }>(sql`
    SELECT source, message, COUNT(*) AS count, COUNT(DISTINCT user_id) AS users, MAX(created_at) AS last_at, MIN(created_at) AS first_at,
           (array_agg(path ORDER BY created_at DESC))[1] AS path, (array_agg(digest ORDER BY created_at DESC))[1] AS digest,
           (array_agg(stack ORDER BY created_at DESC))[1] AS stack, (array_agg(user_agent ORDER BY created_at DESC))[1] AS user_agent
    FROM app_errors WHERE created_at >= ${Date.now() - days * 86_400_000}
    GROUP BY source, message ORDER BY MAX(created_at) DESC LIMIT 100`);
  return rows.map((r) => ({
    source: r.source, message: r.message, count: Number(r.count), users: Number(r.users), lastAt: new Date(Number(r.last_at)), firstAt: new Date(Number(r.first_at)),
    path: r.path, digest: r.digest, stack: r.stack, userAgent: r.user_agent,
  }));
}
