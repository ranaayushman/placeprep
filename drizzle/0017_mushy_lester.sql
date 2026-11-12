CREATE TABLE "mock_exam_access" (
	"mock_id" text NOT NULL,
	"email" text NOT NULL,
	"added_by" text,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	CONSTRAINT "mock_exam_access_mock_id_email_pk" PRIMARY KEY("mock_id","email")
);
--> statement-breakpoint
ALTER TABLE "mock_exams" ADD COLUMN "level" text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "mock_exams" ADD COLUMN "restricted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mock_exam_access" ADD CONSTRAINT "mock_exam_access_mock_id_mock_exams_id_fk" FOREIGN KEY ("mock_id") REFERENCES "public"."mock_exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_exam_access" ADD CONSTRAINT "mock_exam_access_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;