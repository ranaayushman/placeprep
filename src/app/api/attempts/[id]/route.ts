import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { LANGUAGES, type Language } from "@/lib/code/problems";
import { CODE_LIMIT } from "@/lib/code/runner";
import {
  ExamError,
  getExamState,
  heartbeat,
  isViolationType,
  recordViolation,
  runCodeAnswer,
  saveAnswer,
  submitCodeAnswer,
  submitAll,
  submitSection,
} from "@/lib/exam/service";

// Judging a submission compiles and runs up to ~10 tests; well over the default function timeout.
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const codeFields = { questionId: z.string().min(1), language: z.enum(Object.keys(LANGUAGES) as [Language, ...Language[]]), code: z.string().min(1).max(CODE_LIMIT) };

const body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("answer"),
    questionId: z.string().min(1),
    chosenIndex: z.number().int().nullable().optional(),
    textAnswer: z.string().max(10_000).optional(),
    marked: z.boolean().optional(),
    timeDeltaMs: z.number().int().nonnegative().optional(),
  }),
  z.object({ action: z.literal("submit-section"), sectionOrder: z.number().int().nonnegative() }),
  z.object({ action: z.literal("submit") }),
  z.object({ action: z.literal("ping") }),
  z.object({ action: z.literal("violation"), type: z.string().refine(isViolationType) }),
  z.object({ action: z.literal("code-run"), ...codeFields, stdin: z.string().max(CODE_LIMIT).default("") }),
  z.object({ action: z.literal("code-submit"), ...codeFields }),
]);

function fail(err: unknown) {
  if (err instanceof ExamError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error(err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

export async function GET(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const opening = new URL(req.url).searchParams.has("opening");
    return NextResponse.json(await getExamState((await params).id, user.id, { opening }));
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const limited = await rateLimit(`exam:${user.id}`, LIMITS.examApi.limit, LIMITS.examApi.windowMs);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests — slow down" }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { id } = await params;
  const input = parsed.data;
  try {
    switch (input.action) {
      case "answer": {
        const { action: _, ...rest } = input;
        return NextResponse.json(await saveAnswer(id, user.id, rest));
      }
      case "submit-section":
        return NextResponse.json(await submitSection(id, user.id, input.sectionOrder));
      case "ping":
        return NextResponse.json(await heartbeat(id, user.id));
      case "submit":
        await submitAll(id, user.id);
        return NextResponse.json({ finished: true });
      case "violation":
        return NextResponse.json(await recordViolation(id, user.id, input.type as Parameters<typeof recordViolation>[2]));
      case "code-run":
      case "code-submit": {
        // Compiling is far dearer than saving an answer, so it has its own, tighter limit.
        const rl = await rateLimit(`code:${user.id}`, LIMITS.code.limit, LIMITS.code.windowMs);
        if (!rl.ok) return NextResponse.json({ error: `Too many runs — try again in ${rl.retryAfterSec}s` }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
        return NextResponse.json(input.action === "code-run" ? await runCodeAnswer(id, user.id, input) : await submitCodeAnswer(id, user.id, input));
      }
    }
  } catch (err) {
    return fail(err);
  }
}
