import { describe, expect, it } from "vitest";
import { PROBLEMS } from "@/lib/code/problems";
import { COGNIZANT_GENC_PATTERN, EXAMS } from "@/lib/exam/pattern";
import { TOPIC_BY_ID, generate, toView } from "@/lib/questions";

const topic = (id: string) => TOPIC_BY_ID.get(id)!;
import { SOLUTIONS } from "./helpers/cpp-solutions";

describe("Cognizant GenC pattern", () => {
  it("matches the reported round sizes", () => {
    expect(COGNIZANT_GENC_PATTERN.map((s) => [s.section, s.questions, s.minutes])).toEqual([
      ["math", 25, 30],
      ["reasoning", 30, 35],
      ["verbal", 15, 15],
      ["technical", 34, 120],
    ]);
    expect(EXAMS.find((e) => e.id === "cognizant-genc")).toBeTruthy();
  });

  it("names topics that exist, with weights adding up to the section size", () => {
    for (const s of COGNIZANT_GENC_PATTERN) {
      const ids = Object.keys(s.topics!);
      for (const id of ids) expect(topic(id), id).toBeTruthy();
      expect(Object.values(s.topics!).reduce((a, b) => a + b, 0)).toBe(s.questions);
    }
  });

  it("technical round is 2 coding + 2 SQL + 20 debugging + 10 MCQ with big enough pools", () => {
    const tech = COGNIZANT_GENC_PATTERN[3].topics!;
    expect(tech).toEqual({ "c-genc": 2, "c-sql": 2, "t-debug": 20, "t-java": 6, "t-dbms": 4 });
    for (const [id, n] of Object.entries(tech)) expect(topic(id).poolSize!, id).toBeGreaterThanOrEqual(n);
    expect(topic("c-genc").section).toBe("coding");
    expect(topic("c-sql").section).toBe("coding");
    for (let seed = 0; seed < 6; seed++) expect(toView(generate(`c-sql:${seed}`)).problem!.languages).toEqual(["sql"]);
    expect(topic("t-debug").section).toBe("technical");
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
