// Seeds the restricted, real-difficulty Infosys SE mock + its allowlist.
// Run it on your Mac AFTER `npm run db:migrate`:  node scripts/seed/infosys-se-real.mjs
//
// Needs no psql — it uses the "postgres" driver already in the repo.
// Idempotent (ON CONFLICT DO NOTHING), so re-running is safe.
//
// The mock is seeded as DRAFT. Deploy the new code first, then Publish it from
// /admin/mocks/infosys-se-real (your live site runs old code until you deploy,
// and old code has no "restricted" filter).

import postgres from "postgres";
import { readFileSync } from "node:fs";

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const f of [".env.local", ".env"]) {
    try {
      const m = readFileSync(f, "utf8").match(/DATABASE_URL\s*=\s*"?([^"\n]+)"?/);
      if (m) return m[1].trim();
    } catch {}
  }
  throw new Error("DATABASE_URL is not set and was not found in .env.local or .env");
}

const PATTERN = [
  { section: "reasoning", questions: 15, minutes: 25 },
  { section: "math", questions: 10, minutes: 35 },
  { section: "verbal", questions: 20, minutes: 20 },
  { section: "pseudocode", questions: 5, minutes: 10 },
  { section: "puzzle", questions: 4, minutes: 10 },
  { section: "writing", questions: 1, minutes: 20 },
];

// Lower-cased: access is checked case-folded against the signed-in user's email.
// The first entry is your login — keep it so you can never lock yourself out.
const EMAILS = ["ayushmanr621@gmail.com", "try.ayushmanrana@gmail.com", "try.ayushmanran@gmail.com"];

const sql = postgres(databaseUrl(), { prepare: false, ssl: "require" });

try {
  await sql`
    insert into mock_exams (id, company, name, short, note, pattern, level, restricted, status)
    values (
      'infosys-se-real', 'Infosys', 'Systems Engineer (SE) — Real Exam Simulation', 'Infosys SE Real',
      'Access-controlled mock built to match the real Infosys SE paper, based on actual questions reported from recent on-campus drives.',
      ${sql.json(PATTERN)}, 'realistic', true, 'DRAFT'
    )
    on conflict (id) do nothing`;

  for (const email of EMAILS) {
    await sql`insert into mock_exam_access (mock_id, email) values ('infosys-se-real', ${email}) on conflict do nothing`;
  }

  const [mock] = await sql`select id, status, restricted, level from mock_exams where id = 'infosys-se-real'`;
  const access = await sql`select email from mock_exam_access where mock_id = 'infosys-se-real' order by email`;
  console.log("Mock row:", mock);
  console.log("Allowlist:", access.map((a) => a.email));
  console.log("\nDone. Next: deploy the new code, then open /admin/mocks/infosys-se-real and click Publish.");
} finally {
  await sql.end({ timeout: 5 });
}
