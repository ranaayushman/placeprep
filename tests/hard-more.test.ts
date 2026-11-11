import { describe, expect, it } from "vitest";
import { generate } from "@/lib/questions";

// Pure logic: no DB needed. Hard Math/Puzzle answers re-derived from the question text.
const SEEDS = 800;
const ans = (q: { options: string[]; answer: number }) => q.options[q.answer];
const n = (s: string) => Number(s.replace(/[₹,\s]|km\/h|years?/g, ""));

describe("hard math re-derived from the prompt", () => {
  it("boats: speeds that fit both trips give the shipped stream speed", () => {
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`m-boats:${s}:h`);
      const m = /goes (\d+) km upstream and (\d+) km downstream in ([\d.]+) hours\. It goes (\d+) km upstream and (\d+) km downstream in ([\d.]+) hours/.exec(q.prompt);
      if (!m) continue;
      const [x1, y1, t1, x2, y2, t2] = m.slice(1).map(Number);
      const found: number[] = [];
      for (let u = 1; u <= 30; u++) for (let d = u + 1; d <= 40; d++) if (Math.abs(x1 / u + y1 / d - t1) < 1e-9 && Math.abs(x2 / u + y2 / d - t2) < 1e-9) found.push((d - u) / 2);
      expect(found, `${s}`).toEqual([n(ans(q))]);
    }
  });

  it("interest: CI − SI for 3 years matches the shipped principal", () => {
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`m-interest:${s}:h`);
      const m = /for 3 years at (\d+)% per annum is ₹([\d,]+)/.exec(q.prompt);
      if (!m) continue;
      const [r, diff] = [Number(m[1]), n(m[2])];
      const P = n(ans(q));
      expect(Math.round(P * (1 + r / 100) ** 3 - P - (P * r * 3) / 100)).toBe(diff);
    }
  });

  it("partnership: B's share is proportional to money × months", () => {
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`m-ratio:${s}:h`);
      const m = /with ₹([\d,]+)\. (\d+) months later B joins with ₹([\d,]+)\. .* profit is ₹([\d,]+)/.exec(q.prompt);
      if (!m) continue;
      const [a, mo, b, total] = [n(m[1]), Number(m[2]), n(m[3]), n(m[4])];
      expect(n(ans(q))).toBe((total * b * (12 - mo)) / (a * 12 + b * (12 - mo)));
    }
  });
});

describe("hard puzzles re-solved by brute force", () => {
  it("symbol equations: exactly one assignment fits and gives the answer", () => {
    for (let s = 1; s <= 200; s++) {
      const q = generate(`z-symbols:${s}:h`);
      const rhs = [...q.prompt.matchAll(/= (−?\d+)/g)].map((m) => Number(m[1].replace("−", "-")));
      const sols: number[] = [];
      for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) for (let c = 1; c <= 12; c++) for (let d = 1; d <= 12; d++) {
        if (a + b + c === rhs[0] && a * b === rhs[1] && b - c + d === rhs[2] && c * d - a === rhs[3]) sols.push(a * d + b - c);
      }
      expect(sols, `${s}`).toEqual([Number(ans(q))]);
    }
  });

  it("grid sums: the shown cells and sums allow exactly one grid", () => {
    let checked = 0;
    for (let s = 1; s <= 300; s++) {
      const q = generate(`z-rowrule:${s}:h`);
      if (!q.prompt.startsWith("Fill the 3×3 grid")) continue;
      const g = q.grid!;
      const rows = g.slice(0, 3).map((row) => Number(row[3]));
      const cols = g[3].slice(0, 3).map(Number);
      const cells = g.slice(0, 3).flatMap((row) => row.slice(0, 3));
      const perms = (xs: number[]): number[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
      const fits = perms([1, 2, 3, 4, 5, 6, 7, 8, 9]).filter((p) =>
        cells.every((c, i) => typeof c !== "number" || p[i] === c) &&
        [0, 1, 2].every((i) => p[i * 3] + p[i * 3 + 1] + p[i * 3 + 2] === rows[i] && p[i] + p[i + 3] + p[i + 6] === cols[i]),
      );
      expect(fits, `${s}`).toHaveLength(1);
      expect(String(fits[0][cells.indexOf("?")])).toBe(ans(q));
      checked++;
    }
    expect(checked).toBeGreaterThan(30);
  }, 120_000);
});
