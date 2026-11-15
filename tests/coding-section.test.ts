import { describe, expect, it } from "vitest";
import { PROBLEMS } from "@/lib/code/problems";
import { DELOITTE_NLA_PATTERN, PRACTICE_TARGETS } from "@/lib/exam/pattern";
import { planTopics, scopedTopics } from "@/lib/exam/plan";
import { generate, SECTION_LABELS, TOPIC_BY_ID, topicsFor, toView } from "@/lib/questions";
import { CODE_ACCEPTED } from "@/lib/questions/code-problems";

describe("Deloitte NLA coding section", () => {
  const spec = DELOITTE_NLA_PATTERN.find((s) => s.section === "coding")!;

  it("is the last section: 2 questions in 25 minutes, one nugget and one program", () => {
    expect(DELOITTE_NLA_PATTERN.at(-1)).toBe(spec);
    expect([spec.questions, spec.minutes]).toEqual([2, 25]);
    expect(Object.keys(spec.topics!).sort()).toEqual(["c-nugget", "c-program"]);
    expect(SECTION_LABELS.coding).toBe("Coding");
    expect(PRACTICE_TARGETS.coding).toBe(0.5);
    // With two topics and two slots the planner serves exactly one of each, whatever the randomness.
    for (let i = 0; i < 50; i++) {
      const ids = planTopics(scopedTopics(topicsFor("coding"), spec.topics), spec.questions).map((t) => t.id).sort();
      expect(ids).toEqual(["c-nugget", "c-program"]);
    }
  });

  it("serves every problem of the right tier as a code question with the accepted sentinel, and never the hidden tests", () => {
    for (const [id, tier] of [["c-nugget", "nugget"], ["c-program", "program"]] as const) {
      const t = TOPIC_BY_ID.get(id)!;
      const pool = PROBLEMS.filter((p) => p.tier === tier);
      expect(t.section).toBe("coding");
      expect(t.poolSize).toBe(pool.length);
      expect(pool.length).toBeGreaterThanOrEqual(5);
      const served = new Set<string>();
      for (let seed = 0; seed < pool.length * 3; seed++) {
        const q = generate(`${id}:${seed}`);
        expect(q.kind).toBe("code");
        expect(q.answer).toBe(CODE_ACCEPTED);
        expect(q.options).toEqual([]);
        expect(pool.some((p) => p.id === q.problem!.id && p.statement === q.prompt)).toBe(true);
        expect(JSON.stringify(toView(q))).not.toContain('"tests"');
        served.add(q.problem!.id);
      }
      expect(served.size).toBe(pool.length);
    }
  });

  it("keeps the problem types reported from real NLA papers in the nugget pool", () => {
    const nuggets = PROBLEMS.filter((p) => p.tier === "nugget").map((p) => p.id);
    for (const id of ["move-zeros", "toggle-bits", "count-near", "difference-of-sums", "sort-012"]) expect(nuggets).toContain(id);
  });
});
