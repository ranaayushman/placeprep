ALTER TABLE "attempts" ADD COLUMN "exam" text;--> statement-breakpoint
-- Every mock so far was an Infosys SE mock.
UPDATE "attempts" SET "exam" = 'infosys-se' WHERE "mode" = 'MOCK';
