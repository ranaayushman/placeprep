import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./db";

// Production only: apply pending migrations on boot, so a deploy is "pull image, restart".
if (process.env.NODE_ENV === "production" && process.env.SKIP_MIGRATIONS !== "1") {
  await migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? "./drizzle" });
  console.log("[placeprep] database migrations applied");
}
