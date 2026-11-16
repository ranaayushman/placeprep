import { describe, expect, it } from "vitest";
import { FN_SPECS } from "@/lib/code/fn-specs";
import { fixPythonLines, starterFor, wrapSolution } from "@/lib/code/harness";
import { allTests, PROBLEM_BY_ID, verdict } from "@/lib/code/problems";
import { runCode } from "@/lib/code/runner";
import { FN_SOLUTIONS } from "./helpers/fn-solutions";

const LANGS = ["cpp", "java", "python"] as const;
const signature = (starter: string) => starter.split("\n").find((l) => l.includes("("))!.trim().replace(/\s*\{$/, "");

describe("function-style harness", () => {
  it("has a spec only for real non-SQL problems, and a solution per spec whose signature matches the starter", () => {
    expect(Object.keys(FN_SOLUTIONS).sort()).toEqual(Object.keys(FN_SPECS).sort());
    for (const [id, spec] of Object.entries(FN_SPECS)) {
      const p = PROBLEM_BY_ID.get(id);
      expect(p, id).toBeDefined();
      expect(p!.tier, id).not.toBe("sql");
      for (const lang of LANGS) expect(FN_SOLUTIONS[id][lang], `${id} ${lang}`).toContain(signature(starterFor(spec, lang)));
    }
  });

  for (const lang of LANGS) {
    it(`passes every test of every spec in ${lang}`, async () => {
      for (const [id, spec] of Object.entries(FN_SPECS)) {
        const tests = allTests(PROBLEM_BY_ID.get(id)!);
        const results = await runCode(lang, wrapSolution(spec, lang, FN_SOLUTIONS[id][lang]), tests.map((t) => t.input));
        results.forEach((r, i) => expect(verdict(r, tests[i].output), `${id} ${lang} test ${i}: ${r.stderr}\ngot: ${r.stdout}`).toBe("Accepted"));
      }
    }, 300_000);
  }

  it("compiles the starters once the body returns a default", async () => {
    const stub = { cpp: "return {};", java: "" };
    for (const id of ["count-near", "char-frequency", "symmetric-matrix", "palindrome"]) {
      const spec = FN_SPECS[id];
      const input = allTests(PROBLEM_BY_ID.get(id)!)[0].input;
      for (const lang of LANGS) {
        let code = starterFor(spec, lang);
        if (lang === "cpp") code = code.replace("{\n        \n", `{\n        ${stub.cpp}\n`);
        if (lang === "java") {
          const ret = signature(code).split(" ")[1];
          const def = ret === "boolean" ? "false" : ret === "String" || ret.includes("[]") || ret.startsWith("List") ? "null" : "0";
          code = code.replace("{\n        \n", `{\n        return ${def};\n`);
        }
        const [r] = await runCode(lang, wrapSolution(spec, lang, code), [input]);
        // Java null and Python None lists fail when printed; only the compile matters for those.
        expect(r.status, `${id} ${lang}: ${r.stderr}`).not.toBe("compile_error");
        if (lang === "cpp" || (lang === "python" && spec.returns.type !== "lines")) expect(r.status, `${id} ${lang}: ${r.stderr}`).toBe("ok");
      }
    }
  }, 120_000);

  it("reports compile errors on the student's own line numbers", async () => {
    const spec = FN_SPECS["move-zeros"];
    const [cpp] = await runCode("cpp", wrapSolution(spec, "cpp", "class Solution {\npublic:\n    vector<int> moveZeros(vector<int>& nums) { int x = ; return nums; }\n};"), [""]);
    expect(cpp.status).toBe("compile_error");
    expect(cpp.stderr).toMatch(/main\.cpp:3:/);
    expect(cpp.stderr).not.toMatch(/main\.cpp:[124]:/);
    const [java] = await runCode("java", wrapSolution(spec, "java", "class Solution {\n    public int[] moveZeros(int[] nums) {\n        int x = ;\n        return nums;\n    }\n}"), [""]);
    expect(java.status).toBe("compile_error");
    expect(java.stderr).toMatch(/Main\.java:3:/);
    const [py] = await runCode("python", wrapSolution(spec, "python", "class Solution:\n    def moveZeros(self, nums):\n        return 1 / 0\n"), ["1\n5\n"]);
    expect(py.status).toBe("runtime_error");
    expect(fixPythonLines(py.stderr)).toMatch(/line 3, in moveZeros/);
  }, 60_000);
});
