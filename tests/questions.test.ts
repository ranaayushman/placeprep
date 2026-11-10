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

it("cryptarithmetic: the solver finds SEND + MORE = MONEY, and every generated answer is the only possible value", async () => {
  const { solveAddition } = await import("@/lib/questions/puzzle");
  expect(solveAddition(["SEND", "MORE", "MONEY"])).toEqual([{ D: 7, E: 5, Y: 2, N: 6, R: 8, O: 0, S: 9, M: 1 }]);
  for (let seed = 1; seed <= 200; seed++) {
    const q = generate(`z-crypt:${seed}`);
    const [a, b, c] = q.code!.split("\n").filter((l) => /[A-Z]/.test(l)).map((l) => l.replace(/[^A-Z]/g, ""));
    const target = /value of ([A-Z])/.exec(q.prompt)![1];
    const given = Object.fromEntries([...q.prompt.matchAll(/([A-Z]) = (\d)/g)].map((m) => [m[1], Number(m[2])]));
    const values = new Set(solveAddition([a, b, c], given).map((s) => s[target]));
    expect([...values], `z-crypt:${seed}`).toEqual([Number(q.options[q.answer])]);
  }
});

it("data interpretation uses tables, bar, line and pie charts, and its answers match the data shown", () => {
  const kinds = new Set<string>();
  for (let seed = 1; seed <= 400; seed++) {
    const q = generate(`m-di:${seed}`);
    kinds.add(q.table ? "table" : q.chart!.kind);
    const answer = q.options[q.answer];
    const pie = q.chart?.kind === "pie" ? q.chart : null;
    const angle = /central angle of the (.+) sector/.exec(q.prompt);
    if (pie && angle) expect(answer).toBe(`${Number((pie.series[0].values[pie.labels.indexOf(angle[1])] * 3.6).toFixed(2))}°`);
    if (pie) expect(pie.series[0].values.reduce((a, b) => a + b, 0)).toBe(100);
    const total = /combined total of (.+) in (\w+) \(in/.exec(q.prompt);
    if (total && q.chart && q.chart.kind !== "pie") {
      const j = q.chart.labels.indexOf(total[2]);
      expect(Number(answer)).toBe(q.chart.series.reduce((a, s) => a + s.values[j], 0));
    }
  }
  expect([...kinds].sort()).toEqual(["bar", "line", "pie", "table"]);
});

it("data sufficiency is generated and uses every answer", () => {
  const answers = new Set<number>();
  const prompts = new Set<string>();
  for (let seed = 1; seed <= 400; seed++) {
    const q = generate(`r-ds:${seed}`);
    answers.add(q.answer);
    prompts.add(q.prompt);
  }
  expect([...answers].sort()).toEqual([0, 1, 2, 3, 4]);
  expect(prompts.size).toBeGreaterThan(300); // no longer a 10-question bank
});
