-- Trigram similarity for the community duplicate check. On Supabase extensions live in the
-- "extensions" schema; create it if missing so the same migration works on plain Postgres.
CREATE SCHEMA IF NOT EXISTS extensions;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fingerprints_stem_trgm_idx" ON "question_fingerprints" USING gin ("norm_stem" extensions.gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fingerprints_options_trgm_idx" ON "question_fingerprints" USING gin ("norm_options" extensions.gin_trgm_ops);--> statement-breakpoint
-- Block Supabase's public Data API, like every other table (see 0001_enable_rls.sql).
ALTER TABLE "community_questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "question_fingerprints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "submission_matches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "question_reports" ENABLE ROW LEVEL SECURITY;
