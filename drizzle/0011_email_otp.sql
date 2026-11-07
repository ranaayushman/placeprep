CREATE TABLE "email_otps" (
	"user_id" text PRIMARY KEY NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"sent_at" bigint NOT NULL,
	"sends" integer DEFAULT 1 NOT NULL,
	"window_start" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint;--> statement-breakpoint
ALTER TABLE "email_otps" ADD CONSTRAINT "email_otps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Block Supabase's public Data API, like every other table (see 0001_enable_rls.sql).
ALTER TABLE "email_otps" ENABLE ROW LEVEL SECURITY;
