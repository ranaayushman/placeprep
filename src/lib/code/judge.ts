import "server-only";
import { allTests, verdict, type Language, type Problem } from "./problems";
import { runCode, type RunResult } from "./runner";

export type CaseResult = RunResult & { input: string; expected: string; passed: boolean; hidden: boolean };
export type SubmitResult = { cases: CaseResult[]; passed: number; total: number };

/**
 * Runs a submission against every test of the problem (samples first) and compares outputs.
 * With `reveal` false, hidden tests keep only their verdict (input, expected and output are blanked),
 * as in the real test where only sample cases are shown.
 */
export async function judge(problem: Problem, lang: Language, code: string, { reveal = true } = {}): Promise<SubmitResult> {
  const tests = allTests(problem);
  const results = await runCode(lang, code, tests.map((t) => t.input));
  const cases = results.map((r, i): CaseResult => {
    const hidden = i >= problem.samples.length;
    const c = { ...r, input: tests[i].input, expected: tests[i].output, passed: verdict(r, tests[i].output) === "Accepted", hidden };
    return hidden && !reveal ? { ...c, input: "", expected: "", stdout: "", stderr: r.status === "compile_error" ? r.stderr : "" } : c;
  });
  return { cases, passed: cases.filter((c) => c.passed).length, total: cases.length };
}
