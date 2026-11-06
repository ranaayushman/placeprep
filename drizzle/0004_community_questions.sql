CREATE TABLE "community_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"section" text NOT NULL,
	"topic" text NOT NULL,
	"company" text NOT NULL,
	"year" integer,
	"stem" text NOT NULL,
	"code" text,
	"options" jsonb NOT NULL,
	"answer_index" integer NOT NULL,
	"explanation" text NOT NULL,
	"source_type" text NOT NULL,
	"status" text NOT NULL,
	"best_match_score" real DEFAULT 0 NOT NULL,
	"duplicate_of_ref" text,
	"rejection_reason" text,
	"reviewed_by" text,
	"reviewed_at" bigint,
	"norm_stem" text NOT NULL,
	"norm_options" text NOT NULL,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	"updated_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_fingerprints" (
	"ref" text PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"topic" text NOT NULL,
	"norm_stem" text NOT NULL,
	"norm_options" text NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_matches" (
	"submission_id" text NOT NULL,
	"matched_ref" text NOT NULL,
	"score" real NOT NULL,
	"stem_score" real NOT NULL,
	"options_score" real NOT NULL,
	CONSTRAINT "submission_matches_submission_id_matched_ref_pk" PRIMARY KEY("submission_id","matched_ref")
);
--> statement-breakpoint
ALTER TABLE "community_questions" ADD CONSTRAINT "community_questions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_questions" ADD CONSTRAINT "community_questions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_question_id_community_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."community_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_matches" ADD CONSTRAINT "submission_matches_submission_id_community_questions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."community_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_status_idx" ON "community_questions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "community_topic_idx" ON "community_questions" USING btree ("section","topic","status");--> statement-breakpoint
CREATE INDEX "community_author_idx" ON "community_questions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "fingerprints_section_idx" ON "question_fingerprints" USING btree ("section");--> statement-breakpoint
CREATE UNIQUE INDEX "question_reports_once_uq" ON "question_reports" USING btree ("question_id","user_id");--> statement-breakpoint
CREATE INDEX "question_reports_open_idx" ON "question_reports" USING btree ("question_id","status");