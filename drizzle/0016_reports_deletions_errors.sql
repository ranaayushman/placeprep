CREATE TABLE "app_errors" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"digest" text,
	"path" text,
	"user_agent" text,
	"user_id" text,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"topic" text NOT NULL,
	"user_id" text NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"resolved_by" text,
	"resolved_at" bigint,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deletion_requests" (
	"user_id" text PRIMARY KEY NOT NULL,
	"reason" text,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_errors" ADD CONSTRAINT "app_errors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_reports" ADD CONSTRAINT "bank_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_reports" ADD CONSTRAINT "bank_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_errors_created_idx" ON "app_errors" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_reports_once_uq" ON "bank_reports" USING btree ("ref","user_id");--> statement-breakpoint
CREATE INDEX "bank_reports_status_idx" ON "bank_reports" USING btree ("status","topic");--> statement-breakpoint
ALTER TABLE "bank_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deletion_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "app_errors" ENABLE ROW LEVEL SECURITY;
