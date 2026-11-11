import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { attempts, db, mockExams } from "@/db";
import type { SectionId } from "@/lib/questions/types";
import { RC_GROUP } from "@/lib/questions/verbal";
import { EXAMS, type ExamLevel, type SectionSpec } from "./pattern";

export type Exam = { id: string; company: string; name: string; short: string; pattern: readonly SectionSpec[]; note: string | null; level: ExamLevel; builtIn: boolean };
export type MockExamRow = typeof mockExams.$inferSelect;

const BUILT_IN: Exam[] = EXAMS.map((e) => ({ ...e, builtIn: true }));
const fromRow = (r: MockExamRow): Exam => ({ id: r.id, company: r.company, name: r.name, short: r.short, note: r.note, pattern: r.pattern as SectionSpec[], level: "normal", builtIn: false });

/** Every exam students can take: the built-in ones, then published ones from the admin panel. */
export async function listExams(): Promise<Exam[]> {
  const rows = await db.select().from(mockExams).where(eq(mockExams.status, "PUBLISHED")).orderBy(asc(mockExams.createdAt));
  return [...BUILT_IN, ...rows.map(fromRow)];
}

/** A takeable exam by id (built-in or published), or undefined. Drafts are never takeable. */
export async function getExam(id: string): Promise<Exam | undefined> {
  const builtIn = BUILT_IN.find((e) => e.id === id);
  if (builtIn) return builtIn;
  const [row] = await db.select().from(mockExams).where(and(eq(mockExams.id, id), eq(mockExams.status, "PUBLISHED")));
  return row ? fromRow(row) : undefined;
}

export const MOCK_SECTIONS: SectionId[] = ["reasoning", "math", "verbal", "pseudocode", "puzzle", "technical", "writing"];
export const MAX_MOCK_SECTIONS = 8;

const sectionSchema = z.object({
  section: z.enum(MOCK_SECTIONS as [SectionId, ...SectionId[]]),
  questions: z.coerce.number().int().min(1, "Each section needs at least 1 question").max(60, "At most 60 questions per section"),
  minutes: z.coerce.number().int().min(1, "Each section needs at least 1 minute").max(180, "At most 180 minutes per section"),
});

export const mockExamSchema = z.object({
  company: z.string().trim().min(2, "Company name is too short").max(40),
  name: z.string().trim().min(3, "Exam name is too short").max(80),
  short: z.string().trim().min(2, "Short name is too short").max(30),
  note: z.string().trim().max(300).optional().transform((v) => v || null),
  pattern: z
    .array(sectionSchema)
    .min(1, "Add at least one section")
    .max(MAX_MOCK_SECTIONS)
    .superRefine((secs, ctx) => {
      const ids = secs.map((s) => s.section);
      if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "Each section type can appear only once" });
      if (secs.some((s) => s.section === "writing" && s.questions !== 1)) ctx.addIssue({ code: "custom", message: "The writing section has exactly 1 essay" });
      // A verbal section always starts with one reading passage and its questions.
      if (secs.some((s) => s.section === "verbal" && s.questions < RC_GROUP)) ctx.addIssue({ code: "custom", message: `A verbal section needs at least ${RC_GROUP} questions (one reading passage)` });
      if (secs.reduce((a, s) => a + s.minutes, 0) > 300) ctx.addIssue({ code: "custom", message: "The whole mock can be at most 300 minutes" });
    }),
});
export type MockExamInput = z.input<typeof mockExamSchema>;

export class MockExamError extends Error {}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Creates a draft (id = null) or edits one. Published mocks must be unpublished by an admin before editing. */
export async function saveDraft(userId: string, id: string | null, input: MockExamInput) {
  const v = mockExamSchema.parse(input);
  if (id) {
    const [row] = await db
      .update(mockExams)
      .set({ ...v, updatedAt: new Date() })
      .where(and(eq(mockExams.id, id), eq(mockExams.status, "DRAFT")))
      .returning();
    if (!row) throw new MockExamError("Only drafts can be edited. Ask an admin to unpublish it first.");
    return row;
  }
  const newId = slug(v.short);
  if (!newId) throw new MockExamError("The short name needs letters or numbers");
  if (BUILT_IN.some((e) => e.id === newId)) throw new MockExamError("That short name is taken by a built-in mock");
  const [row] = await db.insert(mockExams).values({ id: newId, ...v, createdBy: userId }).onConflictDoNothing().returning();
  if (!row) throw new MockExamError("A mock with that short name already exists");
  return row;
}

/** Admin only (callers check requireAdmin). */
export async function setPublished(adminId: string, id: string, publish: boolean) {
  const [row] = await db
    .update(mockExams)
    .set({ status: publish ? "PUBLISHED" : "DRAFT", publishedBy: publish ? adminId : null, updatedAt: new Date() })
    .where(and(eq(mockExams.id, id), eq(mockExams.status, publish ? "DRAFT" : "PUBLISHED")))
    .returning();
  if (!row) throw new MockExamError(publish ? "Only drafts can be published" : "It isn't published");
  return row;
}

/** Drafts nobody has taken: once students have attempts on a mock, it stays (unpublished) for their history. */
export async function deleteDraft(id: string) {
  const [taken] = await db.select({ id: attempts.id }).from(attempts).where(eq(attempts.exam, id)).limit(1);
  if (taken) throw new MockExamError("Students have taken this mock, so it can't be deleted. Leave it unpublished instead.");
  const [row] = await db.delete(mockExams).where(and(eq(mockExams.id, id), eq(mockExams.status, "DRAFT"))).returning();
  if (!row) throw new MockExamError("Only drafts can be deleted. Unpublish it first.");
}

export const staffMockExams = () => db.select().from(mockExams).orderBy(asc(mockExams.status), asc(mockExams.createdAt));
export const mockExamById = async (id: string) => (await db.select().from(mockExams).where(eq(mockExams.id, id)))[0];
