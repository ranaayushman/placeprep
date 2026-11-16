CREATE TABLE "featured_exams" (
	"exam_id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"added_by" text,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "featured_exams" ADD CONSTRAINT "featured_exams_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;