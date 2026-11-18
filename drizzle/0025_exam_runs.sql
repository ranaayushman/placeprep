CREATE TABLE "exam_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"series" text NOT NULL,
	"variant" text NOT NULL,
	"difficulty" text DEFAULT 'standard' NOT NULL,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "run_id" text;--> statement-breakpoint
ALTER TABLE "exam_runs" ADD CONSTRAINT "exam_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_runs_user_idx" ON "exam_runs" USING btree ("user_id","series");--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_run_id_exam_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."exam_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_run_exam_uq" ON "attempts" USING btree ("run_id","exam");