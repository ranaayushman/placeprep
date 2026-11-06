CREATE TABLE "admin_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempt_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"section_order" integer NOT NULL,
	"order" integer NOT NULL,
	"section" text NOT NULL,
	"topic" text NOT NULL,
	"ref" text NOT NULL,
	"payload" text NOT NULL,
	"answer_index" integer NOT NULL,
	"explanation" text NOT NULL,
	"chosen_index" integer,
	"text_answer" text,
	"is_correct" boolean,
	"marked" boolean DEFAULT false NOT NULL,
	"time_spent_ms" integer DEFAULT 0 NOT NULL,
	"answered_at" bigint
);
--> statement-breakpoint
CREATE TABLE "attempt_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"section" text NOT NULL,
	"order" integer NOT NULL,
	"duration_sec" integer NOT NULL,
	"started_at" bigint,
	"ended_at" bigint
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mode" text NOT NULL,
	"status" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"title" text NOT NULL,
	"current_section" integer DEFAULT 0 NOT NULL,
	"violations" integer DEFAULT 0 NOT NULL,
	"auto_submitted" boolean DEFAULT false NOT NULL,
	"score" integer,
	"max_score" integer,
	"started_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	"submitted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"type" text NOT NULL,
	"attempt_id" text,
	"meta" text,
	"ip" text,
	"user_agent" text,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'STUDENT' NOT NULL,
	"blocked_at" bigint,
	"blocked_reason" text,
	"blocked_by" text,
	"last_seen_at" bigint,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_sections" ADD CONSTRAINT "attempt_sections_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_actions_target_idx" ON "admin_actions" USING btree ("target_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_questions_pos_uq" ON "attempt_questions" USING btree ("attempt_id","section_order","order");--> statement-breakpoint
CREATE INDEX "attempt_questions_topic_idx" ON "attempt_questions" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "attempt_questions_answered_idx" ON "attempt_questions" USING btree ("attempt_id","answered_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_sections_order_uq" ON "attempt_sections" USING btree ("attempt_id","order");--> statement-breakpoint
CREATE INDEX "attempts_user_idx" ON "attempts" USING btree ("user_id","mode","status");--> statement-breakpoint
CREATE INDEX "attempts_status_idx" ON "attempts" USING btree ("status","mode");--> statement-breakpoint
CREATE INDEX "events_user_idx" ON "events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "events" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_last_seen_idx" ON "users" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "users_blocked_idx" ON "users" USING btree ("blocked_at");