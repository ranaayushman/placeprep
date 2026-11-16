import { describe, expect, it } from "vitest";
import { countLatin, gameTopics, shortestPath } from "@/lib/questions/games";

const topic = (id: string) => gameTopics.find((t) => t.id === id)!;
const SEEDS = Array.from({ length: 150 }, (_, i) => i * 7919 + 3);
const both = (id: string) => SEEDS.flatMap((s) => [topic(id).generate(s), topic(id).hard!(s)]);

describe("game generators", () => {
  it("always give 4 distinct options", () => {
    for (const t of gameTopics) for (const q of both(t.id)) expect(new Set(q.options).size).toBe(4);
  });

  it("Geo-Sudo: exactly one shape fits the ? cell, and it is the answer", () => {
    for (const q of both("g-geosudo")) {
      const n = q.grid!.length;
      const syms = ["●", "▲", "■", "★", "◆"].slice(0, n);
      const g = q.grid!.map((row) => row.map((c) => (c === null || c === "" ? null : syms.indexOf(c as string))));
      const i = q.grid!.findIndex((row) => row.includes(null));
      const j = q.grid![i].indexOf(null);
      const fits = syms.filter((_, v) => {
        if (g[i].includes(v) || g.some((row) => row[j] === v)) return false;
        const t = g.map((row) => [...row]);
        t[i][j] = v;
        return countLatin(t) > 0;
      });
      expect(fits).toEqual([q.options[q.answer]]);
      expect(countLatin(g.map((row) => [...row]))).toBe(1);
    }
  });

  it("Switch: only the correct code maps the shapes to the output", () => {
    for (const q of both("g-switch")) {
      const lines = q.code!.split("\n");
      const mid = (lines.length > 3 ? lines[2] : lines[0].replace("Input", "")).trim().split(" ");
      const out = lines.at(-1)!.replace("Output", "").trim().split(" ");
      const ok = q.options.filter((c) => [...c].map((d) => mid[Number(d) - 1]).join() === out.join());
      expect(ok).toEqual([q.options[q.answer]]);
    }
  });

  it("Digit: only the correct digits make the equation true", () => {
    for (const q of both("g-digit")) {
      const [lhs, rhs] = q.code!.split(" = ");
      const ok = q.options.filter((o) => {
        const ds = o.split(", ");
        let i = 0;
        const expr = lhs.replace(/□/g, () => ds[i++]).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
        return Function(`return ${expr}`)() === Number(rhs);
      });
      expect(ok).toEqual([q.options[q.answer]]);
    }
  });

  it("Motion: the answer is the BFS shortest path", () => {
    for (const q of both("g-motion")) expect(`${shortestPath(q.grid as string[][])!.steps}`).toBe(q.options[q.answer]);
  });
});
