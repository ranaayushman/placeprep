import { describe, expect, it } from "vitest";
import { generate, TOPIC_BY_ID } from "@/lib/questions";
import { letterPairs, verdict } from "@/lib/questions/reasoning-nla";
import { DELOITTE_NLA_PATTERN, EXAM_BY_ID } from "@/lib/exam/pattern";
import { planTopics, scopedTopics } from "@/lib/exam/plan";
import type { Topic } from "@/lib/questions/types";

describe("Deloitte NLA pattern", () => {
  it("matches the reported paper: 13 + 12 + 10 + 30 MCQs at one minute each, then 2 coding problems in 25 min, realistic tier", () => {
    expect(DELOITTE_NLA_PATTERN.map((s) => [s.section, s.questions, s.minutes])).toEqual([["verbal", 13, 13], ["reasoning", 12, 12], ["math", 10, 10], ["technical", 30, 30], ["coding", 2, 25]]);
    expect(EXAM_BY_ID.get("deloitte-nla")?.level).toBe("realistic");
  });

  it("names only topics that exist, in the right section, and leaves out data interpretation and clocks", () => {
    for (const spec of DELOITTE_NLA_PATTERN) {
      for (const id of Object.keys(spec.topics!)) expect(TOPIC_BY_ID.get(id)?.section, id).toBe(spec.section);
    }
    const ids = DELOITTE_NLA_PATTERN.flatMap((s) => Object.keys(s.topics!));
    expect(ids).not.toContain("m-di");
    expect(ids).not.toContain("r-clock");
    expect(ids).toEqual(expect.arrayContaining(["t-testing", "t-fundamentals", "r-alpha", "r-statement", "v-error", "v-voice", "v-oneword"]));
  });

  it("scopedTopics keeps only the named topics at the exam's weights, and everything when unscoped", () => {
    const all: Topic[] = ["a", "b", "c"].map((id) => ({ id, section: "math", label: id, weight: 9, targetSec: 1, generate: () => generate("m-percent:1") }));
    expect(scopedTopics(all)).toBe(all);
    expect(scopedTopics(all, { a: 1, c: 4 }).map((t) => [t.id, t.weight])).toEqual([["a", 1], ["c", 4]]);
    // A technical section planned from the scoped list never serves an unscoped topic.
    const spec = DELOITTE_NLA_PATTERN.find((s) => s.section === "technical")!;
    const scoped = scopedTopics([...TOPIC_BY_ID.values()].filter((t) => t.section === "technical"), spec.topics);
    const picked = planTopics(scoped, spec.questions);
    expect(picked).toHaveLength(30);
    expect(new Set(picked.map((t) => t.id)).size).toBe(Object.keys(spec.topics!).length);
  });
});

describe("letter puzzles", () => {
  it("counts letter pairs like a human would", () => {
    expect(letterPairs("ABC")).toEqual(["AB", "AC", "BC"]);
    expect(letterPairs("CAT")).toEqual([]);
    expect(letterPairs("XZ")).toEqual([]);
    expect(letterPairs("ACE").length).toBe(0); // A–C: 1 letter between in alphabet, 0 in the word
  });

  it("generated answers agree with an independent brute-force check", () => {
    const pos = (c: string) => c.charCodeAt(0) - 64;
    for (let seed = 1; seed <= 300; seed++) {
      const q = generate(`r-alpha:${seed}`);
      const answer = q.options[q.answer];
      let m: RegExpExecArray | null;
      if ((m = /word (\w+) are rearranged.*?(\d+)(?:st|nd|rd|th) from the (left|right)/.exec(q.prompt))) {
        const sorted = [...m[1]].sort();
        expect(answer).toBe(m[3] === "left" ? sorted[Number(m[2]) - 1] : sorted[sorted.length - Number(m[2])]);
      } else if ((m = /pairs of letters in the word (\w+)/.exec(q.prompt))) {
        const w = m[1];
        let n = 0;
        for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) if (Math.abs(pos(w[j]) - pos(w[i])) === j - i) n++;
        expect(answer).toBe(String(n));
      } else if ((m = /how many (\d)s are (?:immediately preceded by (\d) and )?immediately followed by (\d)/.exec(q.prompt))) {
        const d = q.code!.split(" ").map(Number);
        const [x, y, z] = [Number(m[1]), m[2] === undefined ? undefined : Number(m[2]), Number(m[3])];
        let n = 0;
        for (let i = 1; i < d.length - 1; i++) if (d[i] === x && d[i + 1] === z && (y === undefined || d[i - 1] === y)) n++;
        expect(answer).toBe(String(n));
      } else if ((m = /(\d+)(?:st|nd|rd|th) to the (left|right) of the (\d+)(?:st|nd|rd|th) letter from the (left|right) end/.exec(q.prompt))) {
        const [n, k] = [Number(m[1]), Number(m[3])];
        const p = m[4] === "left" ? k + n : 27 - k - n;
        expect(answer).toBe(String.fromCharCode(64 + p));
      } else {
        expect(q.prompt).toMatch(/next term of the series/);
      }
    }
  });
});

describe("statement logic", () => {
  it("judges three-statement truth, including the classic enrolment question", () => {
    // Class A > Class B; Class C < Class B; is Class A < Class C?  → false
    expect(verdict([["A", "B"], ["B", "C"]], ["C", "A"])).toBe("False");
    expect(verdict([["A", "B"], ["B", "C"]], ["A", "C"])).toBe("True");
    expect(verdict([["A", "B"], ["A", "C"]], ["B", "C"])).toBe("Uncertain");
    expect(verdict([["A", "C"], ["B", "C"]], ["C", "A"])).toBe("False");
  });

  it("never claims the first two statements contradict each other", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const q = generate(`r-statement:${seed}`);
      expect(q.options[q.answer]).not.toMatch(/contradict/);
    }
  });
});
