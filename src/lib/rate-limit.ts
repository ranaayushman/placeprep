import "server-only";
import { lt, sql } from "drizzle-orm";
import { db, rateLimits } from "@/db";

/**
 * Fixed-window limiter kept in Postgres, so every Vercel instance shares the same counts.
 * One atomic upsert per call: a new window resets the count, otherwise it goes up by one.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfterSec: number }> {
  const now = Date.now();
  const expired = sql`${rateLimits.windowStart} <= ${now - windowMs}`;
  const [row] = await db
    .insert(rateLimits)
    .values({ key, hits: 1, windowStart: new Date(now) })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        hits: sql`CASE WHEN ${expired} THEN 1 ELSE ${rateLimits.hits} + 1 END`,
        windowStart: sql`CASE WHEN ${expired} THEN ${now} ELSE ${rateLimits.windowStart} END`,
      },
    })
    .returning({ hits: rateLimits.hits, windowStart: rateLimits.windowStart });
  // Now and then, drop counters idle for a day so the table stays small.
  if (Math.random() < 0.01) await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(now - 24 * 60 * 60 * 1000)));
  if (row.hits <= limit) return { ok: true, retryAfterSec: 0 };
  return { ok: false, retryAfterSec: Math.max(1, Math.ceil((row.windowStart.getTime() + windowMs - now) / 1000)) };
}

export const LIMITS = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Answer saves etc. A real candidate needs far fewer than this. */
  examApi: { limit: 240, windowMs: 60 * 1000 },
  startTest: { limit: 20, windowMs: 60 * 60 * 1000 },
  /** Password changes: stops guessing the current password from a stolen session. */
  password: { limit: 5, windowMs: 15 * 60 * 1000 },
};
