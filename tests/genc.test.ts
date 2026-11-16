import { describe, expect, it } from "vitest";
import { PROBLEMS } from "@/lib/code/problems";
import { COGNIZANT_GENC_PATTERN, COGNIZANT_GENC_PYTHON_PATTERN, EXAMS } from "@/lib/exam/pattern";
import { DEBUG, DEBUG_PY } from "@/lib/questions/genc";
import { TOPIC_BY_ID, generate, toView } from "@/lib/questions";

const topic = (id: string) => TOPIC_BY_ID.get(id)!;
import { SOLUTIONS } from "./helpers/cpp-solutions";

describe("Cognizant GenC pattern", () => {
  it("matches the reported round sizes", () => {
    expect(COGNIZANT_GENC_PATTERN.map((s) => [s.section, s.questions, s.minutes])).toEqual([
      ["math", 25, 30],
      ["reasoning", 30, 35],
      ["verbal", 15, 15],
      ["game", 24, 50],
      ["technical", 34, 120],
    ]);
    expect(EXAMS.find((e) => e.id === "cognizant-genc")).toBeTruthy();
    expect(EXAMS.find((e) => e.id === "cognizant-genc-hard")?.level).toBe("hard");
  });

  it("names topics that exist, with weights adding up to the section size", () => {
    for (const s of [...COGNIZANT_GENC_PATTERN, ...COGNIZANT_GENC_PYTHON_PATTERN]) {
      const ids = Object.keys(s.topics!);
      for (const id of ids) expect(topic(id), id).toBeTruthy();
      expect(Object.values(s.topics!).reduce((a, b) => a + b, 0)).toBe(s.questions);
    }
  });

  it("technical round is 2 coding + 2 SQL + 20 debugging + 10 MCQ with big enough pools", () => {
    const tech = COGNIZANT_GENC_PATTERN[4].topics!;
    expect(tech).toEqual({ "c-genc": 2, "c-sql": 2, "t-debug": 20, "t-java": 6, "t-dbms": 4 });
    for (const [id, n] of Object.entries(tech)) expect(topic(id).poolSize!, id).toBeGreaterThanOrEqual(n);
    expect(topic("c-genc").section).toBe("coding");
    expect(topic("c-sql").section).toBe("coding");
    for (let seed = 0; seed < 6; seed++) expect(toView(generate(`c-sql:${seed}`)).problem!.languages).toEqual(["sql"]);
    expect(topic("t-debug").section).toBe("technical");
  });

  it("Python cluster swaps the Java banks for Python ones and shares the rest", () => {
    expect(COGNIZANT_GENC_PYTHON_PATTERN.slice(0, 4)).toEqual(COGNIZANT_GENC_PATTERN.slice(0, 4));
    expect(COGNIZANT_GENC_PYTHON_PATTERN[4].topics).toEqual({ "c-genc": 2, "c-sql": 2, "t-debug-py": 20, "t-python": 6, "t-dbms": 2, "t-cloud": 2 });
    expect(EXAMS.find((e) => e.id === "cognizant-genc-python")).toBeTruthy();
    expect(DEBUG.some((q) => q.lang === "Python")).toBe(false);
    expect(DEBUG_PY.some((q) => q.lang === "Java")).toBe(false);
    for (const pool of [DEBUG, DEBUG_PY]) expect(pool.length).toBeGreaterThanOrEqual(60);
    for (let seed = 0; seed < 6; seed++) expect(toView(generate(`c-genc:${seed}`)).problem!.languages).toEqual(["cpp", "java", "python"]);
  });

  it("every GenC coding problem has a reference solution and hidden tests", () => {
    for (const p of PROBLEMS.filter((p) => p.tier === "genc")) {
      expect(SOLUTIONS[p.id], p.id).toBeTruthy();
      expect(p.tests.length, p.id).toBeGreaterThanOrEqual(3);
    }
    const ids = new Set<string>();
    for (let seed = 0; seed < 60; seed++) ids.add(toView(generate(`c-genc:${seed}`)).problem!.id);
    expect(ids.size).toBe(topic("c-genc").poolSize);
  });

  it("debugging bank renders code and has four distinct options", () => {
    for (let seed = 0; seed < topic("t-debug").poolSize!; seed++) {
      const q = generate(`t-debug:${seed}`);
      expect(q.code ?? "").not.toBe("");
      expect(new Set(q.options).size).toBe(4);
    }
  });
});
