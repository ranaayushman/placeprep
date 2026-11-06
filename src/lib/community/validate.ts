import { z } from "zod";
import { topicsFor, type SectionId } from "@/lib/questions";
import { COMMUNITY_SECTIONS, COMPANIES, SOURCE_TYPES } from "./config";
import { normalize } from "./normalize";

const HTML_TAG = /<\/?[a-z][^>]*>/i;
const LINK = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|in|net|org|io|co|ly)\b/i;

/** Plain text only: no HTML tags (we render text, never HTML). */
const plain = (min: number, max: number, what: string) =>
  z
    .string()
    .trim()
    .min(min, `${what} must be at least ${min} characters`)
    .max(max, `${what} must be at most ${max} characters`)
    .refine((s) => !HTML_TAG.test(s), `${what} can't contain HTML`);

export const questionSchema = z
  .object({
    section: z.enum(COMMUNITY_SECTIONS, { errorMap: () => ({ message: "Choose a section" }) }),
    topic: z.string().min(1, "Choose a topic"),
    company: z.enum(COMPANIES, { errorMap: () => ({ message: "Choose a company" }) }),
    companyOther: z.string().trim().max(60).optional(),
    year: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1).optional(),
    stem: plain(15, 2000, "The question").refine((s) => !LINK.test(s), "Links aren't allowed in the question"),
    // Code is kept verbatim (`#include <stdio.h>` is fine); it is always rendered as text.
    code: z.string().max(4000).optional(),
    options: z.array(plain(1, 300, "Each option")).length(4, "Give exactly 4 options"),
    answerIndex: z.number({ required_error: "Mark the correct option", invalid_type_error: "Mark the correct option" }).int().min(0, "Mark the correct option").max(3, "Mark the correct option"),
    explanation: plain(20, 2000, "The explanation"),
    sourceType: z.enum(SOURCE_TYPES, { errorMap: () => ({ message: "Choose where the question is from" }) }),
    ownWords: z.literal(true, { errorMap: () => ({ message: "Confirm that you wrote this in your own words" }) }),
  })
  .superRefine((v, ctx) => {
    if (!topicsFor(v.section as SectionId).some((t) => t.id === v.topic)) ctx.addIssue({ code: "custom", path: ["topic"], message: "Choose a topic from this section" });
    if (v.company === "Other" && !v.companyOther) ctx.addIssue({ code: "custom", path: ["companyOther"], message: "Name the company" });
    const norm = v.options.map(normalize);
    if (norm.some((o) => !o)) ctx.addIssue({ code: "custom", path: ["options"], message: "Every option needs real text" });
    else if (new Set(norm).size !== 4) ctx.addIssue({ code: "custom", path: ["options"], message: "The 4 options must all be different" });
  });

export type QuestionInput = z.input<typeof questionSchema>;
export type ValidQuestion = z.output<typeof questionSchema>;
export const companyLabel = (v: Pick<ValidQuestion, "company" | "companyOther">) => (v.company === "Other" ? v.companyOther! : v.company);
