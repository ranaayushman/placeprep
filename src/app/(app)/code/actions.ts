"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { allTests, normalizeOutput, PROBLEM_BY_ID } from "@/lib/code/problems";
import { CODE_LIMIT, runCpp, type RunResult } from "@/lib/code/runner";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export type CaseResult = RunResult & { input: string; expected: string; passed: boolean };
export type SubmitResult = { cases: CaseResult[]; passed: number; total: number };
type Fail = { error: string };

const codeSchema = z.string().min(1, "Write some code first").max(CODE_LIMIT, "Code is too long");

// The compiler runs on the server itself, so only the owner (admin) may use it. See runner.ts.
async function guard(): Promise<Fail | null> {
  const user = await requireAdmin();
  const rl = await rateLimit(`code:${user.id}`, LIMITS.code.limit, LIMITS.code.windowMs);
  return rl.ok ? null : { error: `Too many runs. Try again in ${rl.retryAfterSec}s.` };
}

/** Run with the given input and show whatever the program prints. */
export async function runAction(input: { code: string; stdin: string }): Promise<RunResult | Fail> {
  const denied = await guard();
  if (denied) return denied;
  const code = codeSchema.safeParse(input.code);
  if (!code.success) return { error: code.error.issues[0].message };
  const stdin = String(input.stdin ?? "").slice(0, CODE_LIMIT);
  const [result] = await runCpp(code.data, [stdin]);
  return result;
}

/** Run against every test of the problem (samples first) and compare outputs. */
export async function submitAction(input: { problemId: string; code: string }): Promise<SubmitResult | Fail> {
  const denied = await guard();
  if (denied) return denied;
  const problem = PROBLEM_BY_ID.get(input.problemId);
  if (!problem) return { error: "Unknown problem" };
  const code = codeSchema.safeParse(input.code);
  if (!code.success) return { error: code.error.issues[0].message };
  const tests = allTests(problem);
  const results = await runCpp(code.data, tests.map((t) => t.input));
  const cases = results.map((r, i) => ({ ...r, input: tests[i].input, expected: tests[i].output, passed: r.status === "ok" && normalizeOutput(r.stdout) === normalizeOutput(tests[i].output) }));
  return { cases, passed: cases.filter((c) => c.passed).length, total: cases.length };
}
