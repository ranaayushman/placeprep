"use server";

import { z } from "zod";
import { requireCodeAccess } from "@/lib/auth";
import { allTests, LANGUAGES, PROBLEM_BY_ID, verdict, type Language } from "@/lib/code/problems";
import { CODE_LIMIT, runCode, type RunResult } from "@/lib/code/runner";
import { FN_SPECS } from "@/lib/code/fn-specs";
import { fixPythonLines, wrapSolution } from "@/lib/code/harness";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export type CaseResult = RunResult & { input: string; expected: string; passed: boolean };
export type SubmitResult = { cases: CaseResult[]; passed: number; total: number };
type Fail = { error: string };

const codeSchema = z.string().min(1, "Write some code first").max(CODE_LIMIT, "Code is too long");
const langSchema = z.enum(Object.keys(LANGUAGES) as [Language, ...Language[]]);

// Student execution requires the isolated remote runner. The local runner executes as the server user.
async function guard(): Promise<Fail | null> {
  const user = await requireCodeAccess();
  if (user.role !== "ADMIN" && !process.env.RUNNER_URL) return { error: "Code execution is unavailable until the secure runner is configured." };
  const rl = await rateLimit(`code:${user.id}`, LIMITS.code.limit, LIMITS.code.windowMs);
  return rl.ok ? null : { error: `Too many runs. Try again in ${rl.retryAfterSec}s.` };
}

/**
 * Practice problems with a function spec take only `class Solution`; wrap it into the full program that
 * reads stdin and prints the result. Python tracebacks are shifted back to the student's line numbers.
 */
async function runPractice(problemId: string | undefined, lang: Language, code: string, stdins: string[]): Promise<RunResult[]> {
  const spec = problemId ? FN_SPECS[problemId] : undefined;
  if (!spec || lang === "sql") return runCode(lang, code, stdins);
  const results = await runCode(lang, wrapSolution(spec, lang, code), stdins);
  return lang === "python" ? results.map((r) => ({ ...r, stderr: fixPythonLines(r.stderr) })) : results;
}

/** Compile once and run on each custom input; shows whatever the program prints. */
export async function runAction(input: { problemId?: string; language: Language; code: string; stdins: string[] }): Promise<RunResult[] | Fail> {
  const denied = await guard();
  if (denied) return denied;
  const lang = langSchema.safeParse(input.language);
  const code = codeSchema.safeParse(input.code);
  if (!lang.success) return { error: "Unsupported language" };
  if (!code.success) return { error: code.error.issues[0].message };
  const stdins = (Array.isArray(input.stdins) ? input.stdins : []).slice(0, 10).map((s) => String(s ?? "").slice(0, CODE_LIMIT));
  if (!stdins.length) return { error: "Add a test case first" };
  return runPractice(typeof input.problemId === "string" ? input.problemId : undefined, lang.data, code.data, stdins);
}

/** Run against every test of the problem (samples first) and compare outputs. */
export async function submitAction(input: { problemId: string; language: Language; code: string }): Promise<SubmitResult | Fail> {
  const denied = await guard();
  if (denied) return denied;
  const problem = PROBLEM_BY_ID.get(input.problemId);
  if (!problem) return { error: "Unknown problem" };
  const lang = langSchema.safeParse(input.language);
  const code = codeSchema.safeParse(input.code);
  if (!lang.success) return { error: "Unsupported language" };
  if (!code.success) return { error: code.error.issues[0].message };
  const tests = allTests(problem);
  const results = await runPractice(problem.id, lang.data, code.data, tests.map((t) => t.input));
  const cases = results.map((r, i) => ({ ...r, input: tests[i].input, expected: tests[i].output, passed: verdict(r, tests[i].output) === "Accepted" }));
  return { cases, passed: cases.filter((c) => c.passed).length, total: cases.length };
}
