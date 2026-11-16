import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { allTests, languagesFor, normalizeOutput, PROBLEM_BY_ID, PROBLEMS, verdict } from "@/lib/code/problems";
import { runCode } from "@/lib/code/runner";
import { SOLUTIONS } from "./helpers/cpp-solutions";

const has = (cmd: string) => {
  try {
    execFileSync(cmd, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const hasCompiler = has(process.env.CXX ?? "g++");
const hasJava = has(process.env.JAVA_HOME ? `${process.env.JAVA_HOME}/bin/javac` : "javac");

describe("problem bank", () => {
  it("has unique ids, at least one sample and three hidden tests each, and every expected output ends with a newline", () => {
    expect(new Set(PROBLEMS.map((p) => p.id)).size).toBe(PROBLEMS.length);
    for (const p of PROBLEMS) {
      expect(p.samples.length, p.id).toBeGreaterThanOrEqual(1);
      expect(p.tests.length, p.id).toBeGreaterThanOrEqual(3);
      for (const t of allTests(p)) expect(t.output.endsWith("\n"), `${p.id}: ${t.output}`).toBe(true);
    }
  });

  it("normalizes trailing whitespace but nothing else", () => {
    expect(normalizeOutput("4 5 1 \n\n")).toBe("4 5 1");
    expect(normalizeOutput("a\r\nb\r\n")).toBe("a\nb");
    expect(normalizeOutput("1\n2")).not.toBe(normalizeOutput("1 2"));
    expect(normalizeOutput("YES\n")).not.toBe(normalizeOutput("yes\n"));
  });
});


describe.skipIf(!hasCompiler)("C++ runner", () => {
  it("has a reference solution for every problem, and each passes all of its tests", async () => {
    expect(Object.keys(SOLUTIONS).sort()).toEqual(PROBLEMS.map((p) => p.id).sort());
    for (const [id, code] of Object.entries(SOLUTIONS)) {
      const problem = PROBLEM_BY_ID.get(id)!;
      const tests = allTests(problem);
      const results = await runCode(languagesFor(problem)[0], code, tests.map((t) => t.input));
      results.forEach((r, i) => {
        expect(r.status, `${id} test ${i}: ${r.stderr}`).toBe("ok");
        expect(normalizeOutput(r.stdout), `${id} test ${i}`).toBe(normalizeOutput(tests[i].output));
      });
    }
  }, 120_000);

  it("reports compile errors, runtime errors, time limits and output limits", async () => {
    const [ce] = await runCode("cpp", "int main() { return 0 }", [""]);
    expect(ce.status).toBe("compile_error");
    expect(ce.stderr).toMatch(/expected|error/);
    const [re] = await runCode("cpp", "#include <cstdlib>\nint main() { std::abort(); }", [""]);
    expect(re.status).toBe("runtime_error");
    const [tle] = await runCode("cpp", "int main() { while (true) {} }", [""]);
    expect(tle.status).toBe("timeout");
    const [ole] = await runCode("cpp", "#include <cstdio>\nint main() { while (true) std::puts(\"spam\"); }", [""]);
    expect(ole.status).toBe("output_limit");
  }, 60_000);

  it("runs several inputs from one compile and feeds stdin to each", async () => {
    const results = await runCode("cpp", "#include <iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a+b<<std::endl;}", ["1 2\n", "10 20\n"]);
    expect(results.map((r) => [r.status, r.stdout.trim()])).toEqual([["ok", "3"], ["ok", "30"]]);
  }, 30_000);
});

const JAVA_SOLUTIONS: Record<string, string> = {
  "move-zeros": `import java.util.*;public class Main{public static void main(String[] a){Scanner s=new Scanner(System.in);int n=s.nextInt();long[] v=new long[n];int k=0;for(int i=0;i<n;i++){long x=s.nextLong();if(x!=0)v[k++]=x;}StringBuilder sb=new StringBuilder();for(int i=0;i<n;i++){sb.append(i<k?v[i]:0);sb.append(i+1<n?" ":"\\n");}System.out.print(sb);}}`,
  "balanced-brackets": `import java.util.*;public class Main{public static void main(String[] a){String s=new Scanner(System.in).next();Deque<Character> st=new ArrayDeque<>();Map<Character,Character> m=Map.of(')','(',']','[','}','{');for(char c:s.toCharArray()){if(m.containsKey(c)){if(st.isEmpty()||st.pop()!=m.get(c)){System.out.println("NO");return;}}else st.push(c);}System.out.println(st.isEmpty()?"YES":"NO");}}`,
};

describe.skipIf(!hasJava)("Java runner", () => {
  it("passes reference solutions and reports compile, runtime and time-limit errors", async () => {
    for (const [id, code] of Object.entries(JAVA_SOLUTIONS)) {
      const tests = allTests(PROBLEM_BY_ID.get(id)!);
      const results = await runCode("java", code, tests.map((t) => t.input));
      results.forEach((r, i) => {
        expect(r.status, `${id} test ${i}: ${r.stderr}`).toBe("ok");
        expect(normalizeOutput(r.stdout), `${id} test ${i}`).toBe(normalizeOutput(tests[i].output));
      });
    }
    const [ce] = await runCode("java", "public class Main { public static void main(String[] a) { int x = ; } }", [""]);
    expect(ce.status).toBe("compile_error");
    expect(ce.stderr).toContain("Main.java");
    const [re] = await runCode("java", "public class Main { public static void main(String[] a) { int[] v = new int[1]; v[2] = 0; } }", [""]);
    expect(re.status).toBe("runtime_error");
    expect(re.stderr).toContain("ArrayIndexOutOfBounds");
    const [tle] = await runCode("java", "public class Main { public static void main(String[] a) { while (true) {} } }", [""]);
    expect(tle.status).toBe("timeout");
  }, 120_000);
});

describe("verdict", () => {
  const ok = (stdout: string) => ({ status: "ok" as const, stdout });
  it("compares outputs loosely and names failures like LeetCode", () => {
    expect(verdict(ok("4 5 1 9 5 0 0 0 \n\n"), "4 5 1 9 5 0 0 0\n")).toBe("Accepted");
    expect(verdict(ok("4 5 1 9 5 0 0 0"), "4 5 1 9 5 0 0 1")).toBe("Wrong Answer");
    expect(verdict(ok("anything"))).toBe("Accepted"); // custom case: nothing to compare with
    expect(verdict({ status: "timeout", stdout: "" }, "x")).toBe("Time Limit Exceeded");
  });
});
