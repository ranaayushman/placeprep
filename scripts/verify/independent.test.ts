/**
 * Independent verification harness for the question generators.
 *
 * Unlike tests/questions.test.ts (which mostly checks structure), this file RE-DERIVES each answer
 * a second, independent way and compares it to what the generator actually ships:
 *   - pseudocode: an independent interpreter runs the *rendered code string* (not the generator's JS)
 *   - syllogism / blood: an independently written solver re-checks logic.ts's output
 *   - math: brute-force recomputation of several topics from the prompt text
 *   - all topics: structural invariants + determinism
 *
 * Run (no DB, no global setup):
 *   npx vitest run --config scripts/verify/vitest.verify.config.ts
 */
import { describe, expect, it } from "vitest";
import { TOPICS, generate } from "@/lib/questions";

const SEEDS = 2000;
const correctOf = (q: { options: string[]; answer: number }) => q.options[q.answer];

// =====================================================================================
// 1. STRUCTURAL INVARIANTS + DETERMINISM (every topic)
// =====================================================================================
describe("structural invariants", () => {
  it.each(TOPICS.map((t) => [t.id, t] as const))("%s", (id, topic) => {
    const bad: string[] = [];
    for (let s = 1; s <= SEEDS; s++) {
      const q = topic.generate(s);
      if (JSON.stringify(generate(`${id}:${s}`)) !== JSON.stringify(q)) bad.push(`${id}:${s} non-deterministic`);
      const blob = [q.prompt, q.code ?? "", q.explanation, ...q.options].join(" | ");
      if (/NaN|undefined|Infinity|\[object/.test(blob)) bad.push(`${id}:${s} junk token`);
      if (q.kind === "essay") {
        if (q.answer !== -1) bad.push(`${id}:${s} essay answer != -1`);
        continue;
      }
      if (q.options.length < 4) bad.push(`${id}:${s} <4 options`);
      if (new Set(q.options).size !== q.options.length) bad.push(`${id}:${s} dup options [${q.options}]`);
      if (q.answer < 0 || q.answer >= q.options.length) bad.push(`${id}:${s} answer out of range`);
    }
    expect(bad.slice(0, 20)).toEqual([]);
  });
});

// =====================================================================================
// 2. PSEUDOCODE — independent interpreter over the RENDERED code string
// =====================================================================================
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim());
}
function fixExpr(e: string): string {
  let x = e.replace(/\bmod\b/g, "%");
  // integer division: n / 10, x / y  ->  _d(n,10), _d(x,y)
  const operand = "[A-Za-z_]\\w*(?:\\[[^\\]]*\\])?|\\d+";
  const re = new RegExp(`(${operand})\\s*\\/\\s*(${operand})`, "g");
  while (re.test(x)) {
    x = x.replace(new RegExp(`(${operand})\\s*\\/\\s*(${operand})`, "g"), "_d($1,$2)");
  }
  return x;
}
function pseudoToJs(code: string): string {
  const out: string[] = [];
  for (const raw of code.split("\n")) {
    const s = raw.trim();
    if (!s) continue;
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^(?:Integer|function)\s+(\w+)\s*\(([^)]*)\)$/))) {
      const params = m[2].split(",").map((p) => p.trim().replace(/^Integer\s+/, "")).filter(Boolean).join(",");
      out.push(`function ${m[1]}(${params}){`);
    } else if (/^End function/i.test(s)) out.push("}");
    else if ((m = s.match(/^Integer\s+(\w+)\s*\[\d+\]\s*=\s*\{([^}]*)\}$/))) out.push(`let ${m[1]} = [${m[2]}];`);
    else if ((m = s.match(/^Integer\s+([\w\s,]+)$/))) out.push(`let ${m[1].trim()};`);
    else if ((m = s.match(/^Set\s+(.+)$/))) out.push(splitTop(m[1]).join("; ") + ";");
    else if ((m = s.match(/^for\s*\(\s*(\w+)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s*,\s*step\s+(\w+))?\s*\)$/))) {
      const [, v, from, to, step] = m;
      out.push(`for(${v}=${fixExpr(from)}; ${v}<=${fixExpr(to)}; ${step ? `${v}+=${step}` : `${v}++`}){`);
    } else if (/^end for$/i.test(s)) out.push("}");
    else if ((m = s.match(/^if\s*\((.+)\)$/))) out.push(`if(${fixExpr(m[1])}){`);
    else if (/^else$/i.test(s)) out.push("}else{");
    else if (/^end if$/i.test(s)) out.push("}");
    else if ((m = s.match(/^while\s*\((.+)\)$/))) out.push(`while(${fixExpr(m[1])}){`);
    else if (/^end while$/i.test(s)) out.push("}");
    else if (/^(break|continue)$/.test(s)) out.push(`${s};`);
    else if ((m = s.match(/^return\s+(.+)$/))) out.push(`return ${fixExpr(m[1])};`);
    else if ((m = s.match(/^Print\s+(.+)$/))) {
      const args = splitTop(m[1]);
      // Several Print statements (e.g. inside a recursive function) print in order, space-separated.
      if (args.length > 1) out.push(`__out.push([${args.map(fixExpr).join(",")}].join(" "));`);
      else out.push(`__out.push(String(${fixExpr(m[1])}));`);
    } else if (/^\w+\s*\(.*\)$/.test(s)) out.push(fixExpr(s) + ";"); // bare call e.g. change(a, b)
    else if (s.includes("=")) {
      const i = s.indexOf("=");
      out.push(`${s.slice(0, i).trim()} = ${fixExpr(s.slice(i + 1).trim())};`);
    } else out.push(`/* unparsed: ${s} */`);
  }
  return out.join("\n");
}
function runPseudo(code: string): string {
  const src = `"use strict"; const _d=(a,b)=>Math.trunc(a/b); const __out=[];\n${pseudoToJs(code)}\nreturn __out.join(" ");`;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(src)() as string;
}
const PSEUDO_TOPICS = ["p-loops", "p-digits", "p-recursion", "p-bitwise", "p-arrays", "p-functions"];

describe("pseudocode: rendered code re-executed independently", () => {
  it("interpreter self-test (digit-reverse template)", () => {
    // Guards against a silently-broken interpreter producing false negatives below.
    let checked = 0;
    for (let s = 1; s < 400 && checked < 5; s++) {
      const q = generate(`p-digits:${s}`);
      if (!q.code?.includes("s = s * 10")) continue;
      const n = Number(/Set n = (\d+)/.exec(q.code)![1]);
      const expected = String(Number(String(n).split("").reverse().join("")));
      expect(runPseudo(q.code)).toBe(expected);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
  it.each([...PSEUDO_TOPICS, ...PSEUDO_TOPICS.filter((id) => TOPICS.find((t) => t.id === id)?.hard).map((id) => `${id}:h`)])("%s matches shipped answer", (topicTier) => {
    const [id, tier] = topicTier.split(":");
    const bad: string[] = [];
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`${id}:${s}${tier ? ":h" : ""}`);
      let got: string;
      try {
        got = runPseudo(q.code!);
      } catch (e) {
        bad.push(`${id}:${s} interpreter threw: ${(e as Error).message}\n${q.code}`);
        continue;
      }
      if (got !== correctOf(q)) bad.push(`${id}:${s} shipped=${correctOf(q)} reexec=${got}\n${q.code}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
});

// =====================================================================================
// 3. SYLLOGISM — independent re-implementation of the region solver, from the PROMPT
// =====================================================================================
type P = { f: string; s: number; p: number };
const REG = [1, 2, 3, 4, 5, 6, 7];
const ins = (r: number, t: number) => (r >> t) & 1;
const DIAG = Array.from({ length: 128 }, (_, mm) => REG.filter((r) => (mm >> (r - 1)) & 1)).filter((pr) =>
  [0, 1, 2].every((t) => pr.some((r) => ins(r, t))),
);
function holdsI(pp: P, pr: number[]) {
  const both = pr.some((r) => ins(r, pp.s) && ins(r, pp.p));
  const snp = pr.some((r) => ins(r, pp.s) && !ins(r, pp.p));
  return pp.f === "A" ? !snp : pp.f === "E" ? !both : pp.f === "I" ? both : snp;
}
function solveI(st: P[], c1: P, c2: P): number {
  const fits = DIAG.filter((d) => st.every((x) => holdsI(x, d)));
  if (!fits.length) return -1;
  const f1 = fits.every((d) => holdsI(c1, d));
  const f2 = fits.every((d) => holdsI(c2, d));
  if (f1 && f2) return 2;
  if (f1) return 0;
  if (f2) return 1;
  return fits.every((d) => holdsI(c1, d) !== holdsI(c2, d)) ? 4 : 3;
}
function parseSent(line: string, idx: Map<string, number>): P {
  let m = line.match(/^All (\w+) are (\w+)\.?$/);
  if (m) return { f: "A", s: id(m[1], idx), p: id(m[2], idx) };
  m = line.match(/^No (\w+) are (\w+)\.?$/);
  if (m) return { f: "E", s: id(m[1], idx), p: id(m[2], idx) };
  m = line.match(/^Some (\w+) are not (\w+)\.?$/);
  if (m) return { f: "O", s: id(m[1], idx), p: id(m[2], idx) };
  m = line.match(/^Some (\w+) are (\w+)\.?$/);
  if (m) return { f: "I", s: id(m[1], idx), p: id(m[2], idx) };
  throw new Error("unparsed sentence: " + line);
}
function id(w: string, idx: Map<string, number>): number {
  if (!idx.has(w)) idx.set(w, idx.size);
  return idx.get(w)!;
}
describe("syllogism: logic.ts cross-checked by an independent solver", () => {
  it("every shipped answer matches independent region solver", () => {
    const bad: string[] = [];
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`r-syllogism:${s}`);
      const lines = q.prompt.split("\n").map((l) => l.trim());
      const st = lines.filter((l) => /^\d+\./.test(l)).map((l) => l.replace(/^\d+\.\s*/, ""));
      const co = lines.filter((l) => /^(I|II)\./.test(l)).map((l) => l.replace(/^(I|II)\.\s*/, ""));
      const idx = new Map<string, number>();
      const stP = st.map((l) => parseSent(l, idx));
      const coP = co.map((l) => parseSent(l, idx));
      const mine = solveI(stP, coP[0], coP[1]);
      if (mine !== q.answer) bad.push(`r-syllogism:${s} shipped=${q.answer} mine=${mine}\n${q.prompt}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
});

// =====================================================================================
// 4. BLOOD RELATIONS — independent chain solver, from the PROMPT
// =====================================================================================
const WORD_STEP: Record<string, string> = { father: "parent", mother: "parent", son: "child", daughter: "child", brother: "sibling", sister: "sibling" };
const WORD_MALE: Record<string, boolean> = { father: true, mother: false, son: true, daughter: false, brother: true, sister: false };
const TABLE: Record<string, [string, string]> = {
  "0,1": ["father", "mother"], "0,2": ["grandfather", "grandmother"], "1,0": ["son", "daughter"],
  "2,0": ["grandson", "granddaughter"], "1,1": ["brother", "sister"], "1,2": ["uncle", "aunt"],
  "2,1": ["nephew", "niece"], "2,2": ["cousin", "cousin"],
};
function solveChainI(steps: string[], firstMale: boolean): string | null {
  type Node = { parent?: Node };
  const ppl: Node[] = [{}];
  for (const st of steps) {
    const cur = ppl[ppl.length - 1];
    if (st === "parent") ppl.push({ parent: cur });
    else if (st === "child") {
      if (cur.parent) return null;
      cur.parent = {};
      ppl.push(cur.parent);
    } else {
      cur.parent ??= {};
      ppl.push({ parent: cur.parent });
    }
  }
  const up = (p: Node) => {
    const c: Node[] = [];
    for (let n: Node | undefined = p; n; n = n.parent) c.push(n);
    return c;
  };
  const xUp = up(ppl[0]);
  const yUp = up(ppl[ppl.length - 1]);
  const b = yUp.findIndex((n) => xUp.includes(n));
  if (b < 0) return null;
  const a = xUp.indexOf(yUp[b]);
  const rel = TABLE[`${a},${b}`];
  return rel ? rel[firstMale ? 0 : 1] : null;
}
describe("blood relations: generated chains cross-checked independently", () => {
  it("every generated-chain answer matches an independent tree solver", () => {
    const bad: string[] = [];
    for (let s = 1; s <= SEEDS; s++) {
      if (s % 4 === 0) continue; // seed%4==0 are hand-written puzzles (verified separately)
      const q = generate(`r-blood:${s}`);
      const sentences = [...q.prompt.matchAll(/(\w+) is the (\w+) of (\w+)\./g)];
      if (!sentences.length) {
        bad.push(`r-blood:${s} could not parse prompt`);
        continue;
      }
      const steps = sentences.map((m) => WORD_STEP[m[2]]);
      const firstMale = WORD_MALE[sentences[0][2]];
      const rel = solveChainI(steps, firstMale);
      const want = rel ? rel[0].toUpperCase() + rel.slice(1) : null;
      if (want !== correctOf(q)) bad.push(`r-blood:${s} shipped=${correctOf(q)} mine=${want}\n${q.prompt}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
});

// =====================================================================================
// 5. MATH — brute-force recomputation from the prompt text
// =====================================================================================
const g = (a: number, b: number): number => (b === 0 ? a : g(b, a % b));
const fr = (n: number, d: number) => {
  const k = g(n, d);
  return d / k === 1 ? `${n / k}` : `${n / k}/${d / k}`;
};
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const C = (n: number, k: number) => fact(n) / (fact(k) * fact(n - k));
describe("math: independent brute-force recomputation", () => {
  it("probability (dice sum & both-red)", () => {
    const bad: string[] = [];
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`m-prob:${s}`);
      let m = q.prompt.match(/sum is (\d+)/);
      if (m) {
        const target = +m[1];
        let c = 0;
        for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === target) c++;
        if (fr(c, 36) !== correctOf(q)) bad.push(`m-prob:${s} dice shipped=${correctOf(q)} mine=${fr(c, 36)}`);
      }
      m = q.prompt.match(/(\d+) red, (\d+) green and (\d+) blue/);
      if (m) {
        const [r, gr, bl] = [+m[1], +m[2], +m[3]];
        const n = r + gr + bl;
        if (fr(C(r, 2), C(n, 2)) !== correctOf(q)) bad.push(`m-prob:${s} balls shipped=${correctOf(q)} mine=${fr(C(r, 2), C(n, 2))}`);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it("number system (unit digit)", () => {
    const bad: string[] = [];
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`m-number:${s}`);
      const m = q.prompt.match(/unit digit of (\d+)\^(\d+)/);
      if (!m) continue;
      const [base, exp] = [+m[1], +m[2]];
      let u = 1;
      for (let i = 0; i < exp; i++) u = (u * base) % 10;
      if (`${u}` !== correctOf(q)) bad.push(`m-number:${s} shipped=${correctOf(q)} mine=${u}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it("permutation & combination (word arrangements)", () => {
    const bad: string[] = [];
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`m-pnc:${s}`);
      const m = q.prompt.match(/letters of the word "(\w+)"/);
      if (!m) continue;
      const w = m[1];
      const cnt = new Map<string, number>();
      for (const ch of w) cnt.set(ch, (cnt.get(ch) ?? 0) + 1);
      const denom = [...cnt.values()].reduce((p, c) => p * fact(c), 1);
      const ans = fact(w.length) / denom;
      if (`${ans}` !== correctOf(q)) bad.push(`m-pnc:${s} word=${w} shipped=${correctOf(q)} mine=${ans}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
});
