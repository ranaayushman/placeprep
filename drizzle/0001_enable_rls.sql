-- Supabase exposes the public schema through its Data API (anon key). RLS with no policies
-- blocks that API entirely; the app connects as the table owner, which bypasses RLS.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attempt_sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attempt_questions" ENABLE ROW LEVEL SECURITY;
