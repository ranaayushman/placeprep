import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import {
  ExamError,
  getExamState,
  isViolationType,
  recordViolation,
  saveAnswer,
  submitAll,
  submitSection,
} from "@/lib/exam/service";

type Ctx = { params: Promise<{ id: string }> };

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
  z.object({ action: z.literal("violation"), type: z.string().refine(isViolationType) }),
]);

function fail(err: unknown) {
  if (err instanceof ExamError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error(err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    return NextResponse.json(await getExamState((await params).id, user.id));
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
      case "submit":
        await submitAll(id, user.id);
        return NextResponse.json({ finished: true });
      case "violation":
        return NextResponse.json(await recordViolation(id, user.id, input.type as Parameters<typeof recordViolation>[2]));
    }
  } catch (err) {
    return fail(err);
  }
}
