import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * GET /api/health
 *
 * Lightweight liveness check that also keeps the Supabase database awake.
 * Hit by a nightly GitHub Actions cron at 1:55 AM IST so the free-tier DB
 * never pauses due to inactivity.
 *
 * Returns 200 { ok: true, db: "ok", ts: <epoch-ms> } on success.
 * Returns 503 { ok: false, error: "..." }  on DB failure.
 */
export async function GET() {
  try {
    // One cheap round-trip — no table scan, just confirms the connection works.
    await db.execute(sql`SELECT 1`);
    return Response.json({ ok: true, db: "ok", ts: Date.now() });
  } catch (err) {
    console.error("[health] DB ping failed:", err);
    return Response.json(
      // The real error is in the server log; don't show database details to the public.
      { ok: false, error: "database unavailable" },
      { status: 503 },
    );
  }
}
