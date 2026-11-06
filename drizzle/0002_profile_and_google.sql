ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "college" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "degree" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "branch" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "passout_year" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dream_company" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarded_at" bigint;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");