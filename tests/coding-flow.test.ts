import { execFileSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, users } from "@/db";
import { PROBLEMS } from "@/lib/code/problems";
import { DELOITTE_NLA_PATTERN } from "@/lib/exam/pattern";
import { createMock, getExamState, getResult, runCodeAnswer, saveAnswer, submitCodeAnswer, submitSection } from "@/lib/exam/service";
import { SOLUTIONS } from "./helpers/cpp-solutions";

const hasCompiler = (() => {
  try {
    execFileSync(process.env.CXX ?? "g++", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

let userId: string;
beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  const [u] = await db.insert(users).values({ email: `code-${Math.random()}@example.com`, name: "Coder", passwordHash: "x" }).returning();
  userId = u.id;
});

describe.skipIf(!hasCompiler)("Deloitte NLA mock: coding section", () => {
  it("reaches a 2-problem coding section, judges submissions on hidden tests and scores the accepted one", async () => {
    const id = await createMock(userId, { exam: "deloitte-nla", includeWriting: true });
    // The four MCQ sections come first; skip through them.
    for (let i = 0; i < DELOITTE_NLA_PATTERN.length - 1; i++) await submitSection(id, userId, i);

    const s = await getExamState(id, userId);
    if (s.status !== "IN_PROGRESS") throw new Error("expected in progress");
    expect(s.current.section).toBe("coding");
    expect(s.current.endsAt! - Date.now()).toBeGreaterThan(24 * 60_000);
    const [q1, q2] = s.current.questions;
    expect(s.current.questions).toHaveLength(2);
    const tiers = s.current.questions.map((q) => PROBLEMS.find((p) => p.id === q.view.problem!.id)!.tier).sort();
    expect(tiers).toEqual(["nugget", "program"]);
    for (const q of [q1, q2]) {
      expect(q.view.kind).toBe("code");
      expect(JSON.stringify(q.view)).not.toContain('"tests"');
      expect(q.key).toBeNull();
    }

    // MCQ-style answers are refused on a code question; a wrong program is judged, hidden cases stay hidden in a mock.
    await expect(saveAnswer(id, userId, { questionId: q1.id, chosenIndex: 0 })).rejects.toThrow("Invalid option");
    const wrong = await submitCodeAnswer(id, userId, { questionId: q1.id, language: "cpp", code: "#include <iostream>\nint main(){std::cout<<\"nope\\n\";}" });
    expect(wrong.accepted).toBe(false);
    expect(wrong.passed).toBe(0);
    expect(wrong.cases.filter((c) => c.hidden).every((c) => c.input === "" && c.expected === "" && c.stdout === "")).toBe(true);
    expect(wrong.cases.filter((c) => !c.hidden).every((c) => c.input !== "" && c.expected !== "")).toBe(true);

    // Run is a scratch run: it echoes the program's output and saves nothing.
    const run = await runCodeAnswer(id, userId, { questionId: q1.id, language: "cpp", code: "#include <iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a*b;}", stdin: "6 7\n" });
    expect([run.status, run.stdout.trim()]).toEqual(["ok", "42"]);

    // The latest submission counts: a correct solution flips the verdict.
    const right = await submitCodeAnswer(id, userId, { questionId: q1.id, language: "cpp", code: SOLUTIONS[q1.view.problem!.id] });
    expect(right.accepted).toBe(true);
    expect(right.passed).toBe(right.total);

    expect((await submitSection(id, userId, DELOITTE_NLA_PATTERN.length - 1)).finished).toBe(true);
    await expect(submitCodeAnswer(id, userId, { questionId: q2.id, language: "cpp", code: SOLUTIONS[q2.view.problem!.id] })).rejects.toThrow();

    const { attempt, questions } = await getResult(id, userId);
    const total = DELOITTE_NLA_PATTERN.reduce((a, p) => a + p.questions, 0);
    expect([attempt.score, attempt.maxScore]).toEqual([1, total]);
    const r1 = questions.find((q) => q.id === q1.id)!;
    const r2 = questions.find((q) => q.id === q2.id)!;
    expect([r1.isCorrect, r1.chosenIndex]).toEqual([true, 1]);
    expect(JSON.parse(r1.textAnswer!)).toMatchObject({ language: "cpp", passed: right.total, total: right.total });
    expect([r2.isCorrect, r2.chosenIndex, r2.textAnswer]).toEqual([null, null, null]);
  }, 120_000);
});

describe("Cognizant GenC mock", () => {
  it("builds a mixed technical round: 2 coding problems first, then 30 MCQs", async () => {
    const id = await createMock(userId, { exam: "cognizant-genc", includeWriting: false });
    for (let i = 0; i < 3; i++) await submitSection(id, userId, i);
    const s = await getExamState(id, userId);
    if (s.status !== "IN_PROGRESS") throw new Error("expected in progress");
    expect(s.current.section).toBe("technical");
    expect(s.current.questions).toHaveLength(32);
    const kinds = s.current.questions.map((q) => q.view.kind);
    expect(kinds.slice(0, 2)).toEqual(["code", "code"]);
    expect(kinds.slice(2).every((k) => k === "mcq")).toBe(true);
    const ids = new Set(s.current.questions.map((q) => q.id));
    expect(ids.size).toBe(32);
  });
});
