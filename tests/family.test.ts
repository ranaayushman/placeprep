import { describe, expect, it } from "vitest";
import { generate } from "@/lib/questions";
import { rel, type Person } from "@/lib/questions/family";
import { solveChain, type Step } from "@/lib/questions/logic";

// Pure logic: no DB needed.
const ans = (q: { options: string[]; answer: number }) => q.options[q.answer];
const format = (p: string) =>
  p.includes("means 'A is the") ? "coded" : p.startsWith("Pointing") ? "pointing" : p.startsWith("A family has six") ? "family puzzle" : /^M is the/.test(p) ? "gender" : /'s \w+'s /.test(p) || /is \w+'s [a-z]+(?:'s [a-z]+)+\. How/.test(p) ? "nested" : "chain";

describe("blood relations: practice is a balanced mix", () => {
  it("a practice-like mix (70% hard) has every format and no format above 30%", () => {
    const counts = new Map<string, number>();
    const N = 1400;
    for (let s = 1; s <= N; s++) {
      const q = generate(`r-blood:${s}${s % 10 < 7 ? ":h" : ""}`);
      const f = format(q.prompt);
      counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    for (const f of ["coded", "pointing", "family puzzle", "gender", "nested", "chain"]) expect(counts.get(f) ?? 0, f).toBeGreaterThan(0);
    for (const [f, c] of counts) expect(c / N, `${f}: ${c}`).toBeLessThan(0.3);
    expect((counts.get("coded") ?? 0) / N).toBeLessThan(0.25);
  });
});

describe("blood relations: answers re-derived", () => {
  it("parent/child/sibling chains match the independent chain solver", () => {
    const STEP: Record<string, [Step, boolean]> = { father: ["parent", true], mother: ["parent", false], brother: ["sibling", true], sister: ["sibling", false], son: ["child", true], daughter: ["child", false] };
    let checked = 0;
    for (let s = 1; s <= 2000; s++) {
      const q = generate(`r-blood:${s}${s % 2 ? ":h" : ""}`);
      const lines = [...q.prompt.matchAll(/(\w+) is the (\w+) of (\w+)\./g)];
      if (format(q.prompt) !== "chain" || !lines.length || lines.some((m) => !STEP[m[2]]) || lines.some((m, i) => i && m[1] !== lines[i - 1][3])) continue;
      const res = solveChain(lines.map((m) => STEP[m[2]][0]), STEP[lines[0][2]][1]);
      if (!res) continue;
      expect(ans(q).toLowerCase(), `${s}: ${q.prompt}`).toBe(res.relation);
      checked++;
    }
    expect(checked).toBeGreaterThan(20);
  });

  it("gender questions: 'Cannot be determined' exactly when M is only called parent/child/sibling", () => {
    let checked = 0;
    for (let s = 1; s <= 3000; s++) {
      const q = generate(`r-blood:${s}`);
      if (format(q.prompt) !== "gender") continue;
      const hidden = /^M is the (parent|child|sibling) of N\./.test(q.prompt);
      expect(ans(q) === "Cannot be determined", q.prompt).toBe(hidden);
      checked++;
    }
    expect(checked).toBeGreaterThan(50);
  });

  it("family puzzles: every family that fits the clues gives the shipped answer", () => {
    const perms = (xs: string[]): string[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
    const families: Map<string, Person>[] = [];
    for (const o of perms(["P", "Q", "R", "S", "T", "U"])) for (const cm of [true, false]) for (const k1 of [true, false]) for (const k2 of [true, false]) {
      const G1: Person = { name: o[0], male: true };
      const G2: Person = { name: o[1], male: false, spouse: G1 };
      G1.spouse = G2;
      const C: Person = { name: o[2], male: cm, father: G1, mother: G2 };
      const D: Person = { name: o[3], male: !cm, spouse: C };
      C.spouse = D;
      const [fa, mo] = cm ? [C, D] : [D, C];
      const people = [G1, G2, C, D, { name: o[4], male: k1, father: fa, mother: mo }, { name: o[5], male: k2, father: fa, mother: mo }];
      families.push(new Map(people.map((p) => [p.name, p])));
    }
    let checked = 0;
    for (let s = 1; s <= 600; s++) {
      const q = generate(`r-blood:${s}${s % 2 ? ":h" : ""}`);
      if (format(q.prompt) !== "family puzzle") continue;
      const clues = [...q.prompt.matchAll(/• (\w) is the ([a-z-]+) of (\w)\./g)];
      const fits = families.filter((f) => clues.every((c) => rel(f.get(c[1])!, f.get(c[3])!) === c[2]));
      const m = /How is (\w) related to (\w)\?/.exec(q.prompt);
      const answers = new Set(fits.map((f) => (m ? rel(f.get(m[1])!, f.get(m[2])!) : String([...f.values()].filter((p) => !p.male).length))));
      expect([...answers], q.prompt).toEqual([m ? ans(q).toLowerCase() : ans(q)]);
      checked++;
    }
    expect(checked).toBeGreaterThan(20);
  }, 120_000);
});
