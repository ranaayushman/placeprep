import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://localhost:5432/placeprep";

/**
 * COUNT/SUM (int8) and AVG (numeric) come back as strings by default; every value here fits a JS
 * number (epoch-ms timestamps, counts), so parse them as numbers.
 */
const asNumber = { from: [20, 1700], to: 20, parse: Number, serialize: String };

const globalForDb = globalThis as unknown as { pg?: postgres.Sql };
// One pool per process; reused across dev hot reloads. Pool size via DATABASE_POOL (default 10, or 1
// on Vercel, where each serverless instance handles one request at a time).
// prepare: false — Supabase's transaction pooler (port 6543) doesn't support prepared statements.
// SSL comes from the URL (?sslmode=require for Supabase).
const client =
  globalForDb.pg ?? postgres(url, { max: Number(process.env.DATABASE_POOL ?? (process.env.VERCEL ? 1 : 10)), prepare: false, types: { asNumber } });
globalForDb.pg = client;

export const db = drizzle(client, { schema });
export * from "./schema";
