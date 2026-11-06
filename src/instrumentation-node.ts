import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./db";

// Production on a long-running server only: apply pending migrations on boot, so a deploy is
// "pull image, restart". Not on Vercel (VERCEL is set there): every cold start would re-run them,
// and a failure would take down every route. Run `npm run db:migrate` before deploying instead.
if (process.env.NODE_ENV === "production" && !process.env.VERCEL && process.env.SKIP_MIGRATIONS !== "1") {
  await migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? "./drizzle" });
  console.log("[placeprep] database migrations applied");
}
