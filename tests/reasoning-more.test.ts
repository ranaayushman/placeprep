import { describe, expect, it } from "vitest";
import { generate } from "@/lib/questions";
import { solveChain, solveSyllogism, type Form, type Step } from "@/lib/questions/logic";

// Pure logic: no DB needed. New reasoning types, answers re-derived independently from the prompt text.
const SEEDS = 600;
const answerOf = (q: { options: string[]; answer: number }) => q.options[q.answer];

function* questions(id: string, hard: boolean, match: (p: string) => boolean) {
  for (let s = 1; s <= SEEDS; s++) {
    const q = generate(`${id}:${s}${hard ? ":h" : ""}`);
    if (match(q.prompt)) yield { s, q };
  }
}

describe("circular seating", () => {
  it.each([false, true])("hard=%s: the answer follows from the only seating that fits the clues", (hard) => {
    let checked = 0;
    for (const { s, q } of questions("r-seating", hard, (p) => p.includes("circular table"))) {
      const names = /— (.+) — sit around/.exec(q.prompt)![1].split(", ");
      const n = names.length;
      const clues = q.prompt.split("\n").filter((l) => l.startsWith("• ")).map((l) => l.slice(2));
      const perms = (xs: string[]): string[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
      const fits = perms(names.slice(1)).map((p) => [names[0], ...p]).filter((o) => {
        const at = (p: string) => o.indexOf(p);
        const L = (p: string, k: number) => o[(at(p) + k) % n];
        const R = (p: string, k: number) => o[(at(p) - k + 4 * n) % n];
        const d = (a: string, b: string) => Math.min((at(a) - at(b) + n) % n, (at(b) - at(a) + n) % n);
        return clues.every((c) => {
          let m;
          if ((m = /^(\w+) sits immediately to the left of (\w+)\.$/.exec(c))) return L(m[2], 1) === m[1];
          if ((m = /^(\w+) sits immediately to the right of (\w+)\.$/.exec(c))) return R(m[2], 1) === m[1];
          if ((m = /^(\w+) sits second to the left of (\w+)\.$/.exec(c))) return L(m[2], 2) === m[1];
          if ((m = /^(\w+) sits second to the right of (\w+)\.$/.exec(c))) return R(m[2], 2) === m[1];
          if ((m = /^(\w+) sits exactly opposite (\w+)\.$/.exec(c))) return d(m[1], m[2]) === n / 2;
          if ((m = /^(\w+) is not an immediate neighbour of (\w+)\.$/.exec(c))) return d(m[1], m[2]) > 1;
          if ((m = /^Exactly one person sits between (\w+) and (\w+)/.exec(c))) return d(m[1], m[2]) === 2;
          throw new Error(`unparsed clue: ${c}`);
        });
      });
      expect(fits, `${s}`).toHaveLength(1);
      const o = fits[0];
      const at = (p: string) => o.indexOf(p);
      const ask = q.prompt.split("\n").at(-1)!;
      let m;
      let want: string;
      if ((m = /opposite (\w+)\?$/.exec(ask)) && !ask.includes("person who")) want = o[(at(m[1]) + n / 2) % n];
      else if ((m = /^Who sits (immediately|second) to the (left|right) of the person who sits opposite (\w+)\?$/.exec(ask))) {
        const opp = o[(at(m[3]) + n / 2) % n];
        const k = m[1] === "immediately" ? 1 : 2;
        want = m[2] === "left" ? o[(at(opp) + k) % n] : o[(at(opp) - k + 4 * n) % n];
      } else {
        m = /immediately to the (left|right) of (\w+)\?$/.exec(ask)!;
        want = m[1] === "left" ? o[(at(m[2]) + 1) % n] : o[(at(m[2]) - 1 + n) % n];
      }
      expect(answerOf(q), `${s}: ${ask}`).toBe(want);
      checked++;
    }
    expect(checked).toBeGreaterThan(30);
  });
});

describe("syllogisms with three statements / possibility", () => {
  it("3-term questions without 'possibility' agree with the original solver", () => {
    const F: Record<string, Form> = { All: "A", No: "E", Some: "I" };
    let checked = 0;
    for (const { q } of questions("r-syllogism", false, (p) => !p.includes("possibility") && p.split("\n").filter((l) => /^\d\./.test(l)).length === 2)) {
      const lines = q.prompt.split("\n");
      const terms: string[] = [];
      const prop = (line: string) => {
        const m = /^(?:\d\.|I+\.) (All|No|Some) (\w+) (?:are|is) (not )?(\w+)\.$/.exec(line)!;
        for (const t of [m[2], m[4]]) if (!terms.includes(t)) terms.push(t);
        const f: Form = m[1] === "Some" && m[3] ? "O" : F[m[1]];
        return { f, s: terms.indexOf(m[2]), p: terms.indexOf(m[4]) };
      };
      const st = [prop(lines[1]), prop(lines[2])];
      const c1 = prop(lines[4]);
      const c2 = prop(lines[5]);
      expect(answerOf(q)).toBe(q.options[solveSyllogism(st, c1, c2)]);
      checked++;
    }
    expect(checked).toBeGreaterThan(50);
  });

  it("hard questions have three statements over four groups", () => {
    for (let s = 1; s <= 50; s++) expect(generate(`r-syllogism:${s}:h`).prompt).toMatch(/\n3\. /);
  });
});

describe("coded blood relations", () => {
  it("the answer matches walking the family tree from the legend", () => {
    let checked = 0;
    const STEP: Record<string, [Step, boolean]> = { father: ["parent", true], mother: ["parent", false], brother: ["sibling", true], sister: ["sibling", false], son: ["child", true], daughter: ["child", false] };
    for (const hard of [false, true]) {
      for (const { q } of questions("r-blood", hard, (p) => p.includes("means 'A is the"))) {
        const legend = new Map([...q.prompt.matchAll(/'A (\S) B' means 'A is the (\w+) of B'/g)].map((m) => [m[1], m[2]]));
        const rel = (expr: string) => {
          const ops = expr.split(" ").filter((_, i) => i % 2 === 1).map((sym) => legend.get(sym)!);
          return solveChain(ops.map((w) => STEP[w][0]), STEP[ops[0]][1])?.relation;
        };
        let m;
        if ((m = /If (.+), how is P related to \w\?/.exec(q.prompt))) expect(answerOf(q).toLowerCase()).toBe(rel(m[1]));
        else {
          m = /means that P is the (\w+) of S\?/.exec(q.prompt)!;
          expect(rel(answerOf(q))).toBe(m[1]);
          for (const o of q.options) if (o !== answerOf(q)) expect(rel(o)).not.toBe(m[1]);
        }
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(50);
  });
});

describe("hard direction", () => {
  it("distance and direction match the coordinates in the statements", () => {
    const D: Record<string, [number, number]> = { north: [0, 1], south: [0, -1], east: [1, 0], west: [-1, 0] };
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`r-direction:${s}:h`);
      const pos = new Map<string, [number, number]>([["P", [0, 0]]]);
      const facts = [...q.prompt.matchAll(/(\w) is (\d+) m (\w+) of (\w)\./g)];
      for (let pass = 0; pass < 5; pass++) for (const f of facts) if (pos.has(f[4]) && !pos.has(f[1])) {
        const [x, y] = pos.get(f[4])!;
        pos.set(f[1], [x + D[f[3]][0] * Number(f[2]), y + D[f[3]][1] * Number(f[2])]);
      }
      const m = /How far is (\w) from (\w),/.exec(q.prompt)!;
      const [bx, by] = pos.get(m[1])!;
      const [ax, ay] = pos.get(m[2])!;
      const [dx, dy] = [bx - ax, by - ay];
      expect(answerOf(q)).toBe(`${Math.hypot(dx, dy)} m, ${dy > 0 ? "North" : "South"}-${dx > 0 ? "East" : "West"}`);
    }
  });
});

describe("variety", () => {
  it("seating, syllogism, blood and ranking each have several standard types", () => {
    const kinds = (id: string, f: (p: string) => string) => new Set(Array.from({ length: 300 }, (_, i) => f(generate(`${id}:${i + 1}`).prompt))).size;
    expect(kinds("r-seating", (p) => (p.includes("circular") ? "circle" : p.startsWith("Six") ? "row6" : "row5"))).toBe(3);
    expect(kinds("r-syllogism", (p) => (p.includes("possibility") ? "possibility" : "plain"))).toBe(2);
    expect(kinds("r-blood", (p) => (p.includes("means 'A is") ? "coded" : "chain"))).toBe(2);
    expect(kinds("r-ranking", (p) => p.slice(0, 25))).toBeGreaterThanOrEqual(3);
  });
});
