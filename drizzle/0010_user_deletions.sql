CREATE TABLE "user_deletions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email_sha256" text NOT NULL,
	"admin_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_actions" DROP CONSTRAINT "admin_actions_admin_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_actions" ALTER COLUMN "admin_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Block Supabase's public Data API, like every other table (see 0001_enable_rls.sql).
ALTER TABLE "user_deletions" ENABLE ROW LEVEL SECURITY;
