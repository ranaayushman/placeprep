-- Seed: restricted, real-difficulty Infosys SE mock + its allowlist.
--
-- Run this ONCE, AFTER the schema migration that adds mock_exams.level,
-- mock_exams.restricted and the mock_exam_access table has been applied
-- (i.e. after `npm run db:generate` + `npm run db:migrate`).
--
-- It is idempotent (ON CONFLICT DO NOTHING), so re-running it is safe.
--
-- What it creates:
--   * A DRAFT, RESTRICTED mock "infosys-se-real" using the reported
--     Infosys SE pattern, at level "realistic" (0% hard tier -> every
--     question is drawn standard, matching the real paper's difficulty).
--   * An allowlist so ONLY the emails below can see or start it.
--
-- Seeded as DRAFT on purpose: your live site still runs the OLD code (no
-- "restricted" filter), so a PUBLISHED row would be visible to everyone.
-- Deploy the new code first, THEN click Publish on /admin/mocks/infosys-se-real.
--
-- The questions themselves are not stored here: like every PlacePrep mock,
-- they are generated fresh from the bank on each attempt. "realistic" is what
-- holds them to real-exam difficulty.

INSERT INTO "mock_exams" ("id", "company", "name", "short", "note", "pattern", "level", "restricted", "status")
VALUES (
  'infosys-se-real',
  'Infosys',
  'Systems Engineer (SE) — Real Exam Simulation',
  'Infosys SE Real',
  'Access-controlled mock built to match the real Infosys SE paper, based on actual questions reported from recent on-campus drives.',
  '[{"section":"reasoning","questions":15,"minutes":25},{"section":"math","questions":10,"minutes":35},{"section":"verbal","questions":20,"minutes":20},{"section":"pseudocode","questions":5,"minutes":10},{"section":"puzzle","questions":4,"minutes":10},{"section":"writing","questions":1,"minutes":20}]'::jsonb,
  'realistic',
  true,
  'DRAFT'
)
ON CONFLICT ("id") DO NOTHING;

-- Allowlist. Emails MUST be lower-cased: access is checked case-folded against
-- the signed-in user's email. The first entry is the account you sign in with —
-- keep it so you are never locked out of your own mock.
INSERT INTO "mock_exam_access" ("mock_id", "email")
VALUES
  ('infosys-se-real', 'ayushmanr621@gmail.com'),
  ('infosys-se-real', 'try.ayushmanrana@gmail.com'),
  ('infosys-se-real', 'try.ayushmanran@gmail.com')
ON CONFLICT ("mock_id", "email") DO NOTHING;
