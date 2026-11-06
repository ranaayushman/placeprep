// Seeds N students, each with an open mock, and writes their session cookies to scripts/load/sessions.json.
// Run: DATABASE_URL=postgres://localhost:5432/placeprep_load npx vitest run --config scripts/load/vitest.load.config.ts
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sessions, users } from "@/db";
import { hashToken } from "@/lib/auth";
import { createMock } from "@/lib/exam/service";

const N = Number(process.env.LOAD_USERS ?? 200);

it(`seeds ${N} students`, async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  const out: { token: string; attemptId: string }[] = [];
  for (let i = 0; i < N; i++) {
    const [u] = await db.insert(users).values({ email: `load${i}-${Date.now()}@example.com`, name: `Load ${i}`, passwordHash: "x" }).returning();
    const token = randomBytes(32).toString("base64url");
    await db.insert(sessions).values({ userId: u.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 86_400_000) });
    out.push({ token, attemptId: await createMock(u.id, { includeWriting: false }) });
  }
  writeFileSync("scripts/load/sessions.json", JSON.stringify(out));
}, 600_000);
