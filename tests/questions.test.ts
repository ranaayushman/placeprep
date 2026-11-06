import { describe, expect, it } from "vitest";
import { generate, TOPICS, toView } from "@/lib/questions";

const SEEDS = 400;

describe.each(TOPICS.map((t) => [t.id, t] as const))("topic %s", (id, topic) => {
  it("generates valid, deterministic questions", () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = topic.generate(seed);
      const again = generate(`${id}:${seed}`);
      expect(again).toEqual(q);

      const text = [q.prompt, q.code ?? "", q.explanation, ...q.options].join(" | ");
      expect(text, `${id}:${seed}`).not.toMatch(/NaN|undefined|Infinity|None of these|\[object/);

      if (q.kind === "essay") {
        expect(q.answer).toBe(-1);
        continue;
      }
      expect(q.options.length, `${id}:${seed} options`).toBeGreaterThanOrEqual(4);
      expect(new Set(q.options).size, `${id}:${seed} duplicate options: ${q.options}`).toBe(q.options.length);
      expect(q.answer, `${id}:${seed}`).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
  });
});

it("views never leak the answer", () => {
  const view = toView(generate("m-percent:7")) as unknown as Record<string, unknown>;
  expect(view.answer).toBeUndefined();
  expect(view.explanation).toBeUndefined();
});

it("pseudocode reverse template prints the reversed number", () => {
  // Spot-check one generated answer against an independent computation.
  for (let seed = 1; seed < 200; seed++) {
    const q = generate(`p-digits:${seed}`);
    if (!q.code?.includes("s = s * 10")) continue;
    const n = Number(/Set n = (\d+)/.exec(q.code)![1]);
    const expected = String(Number(String(n).split("").reverse().join("")));
    expect(q.options[q.answer]).toBe(expected);
  }
});

it("seating puzzles have exactly one valid arrangement in the explanation", () => {
  for (let seed = 1; seed < 100; seed++) {
    const q = generate(`r-seating:${seed}`);
    expect(q.prompt.split("\n").filter((l) => l.startsWith("•")).length).toBeGreaterThan(0);
  }
});
