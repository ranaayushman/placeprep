/**
 * Independent answer checks for every new quant type, DI and data sufficiency. Each checker reads the
 * numbers from the question TEXT (never the generator's variables) and recomputes the answer another
 * way: brute force for counting and probability, solving for algebra. Also checks that:
 *  - a rounded answer is only shown when the question says "to N decimal places", and then rounds right;
 *  - no wrong option has the same value as the correct answer;
 *  - options aren't nonsense (zero or negative where that can't happen).
 */
import { describe, expect, it } from "vitest";
import { rng } from "@/lib/questions/rng";
import { generate, type Question } from "@/lib/questions";
import * as X from "@/lib/questions/math-extra";

const SEEDS = 1500;

// ── Parsing helpers ───────────────────────────────────────────────────────────
/** Numbers in a text, in order. Handles ₹, Indian commas, decimals and the typographic minus. */
const nums = (s: string) => [...s.replace(/−/g, "-").replace(/(\d),(?=\d)/g, "$1").matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
/** Value of an option: "₹1,430" → 1430, "8% loss" → −8, "5/324" → 0.0154…, "2:3" → 0.666… */
function value(opt: string): number {
  const t = opt.replace(/−/g, "-").replace(/,/g, "");
  const frac = /^(-?\d+)\/(\d+)$/.exec(t.trim());
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const ratio = /^(\d+):(\d+)$/.exec(t.trim());
  if (ratio) return Number(ratio[1]) / Number(ratio[2]);
  const n = Number(/-?\d+(?:\.\d+)?/.exec(t)![0]);
  return /loss|decrease/.test(t) ? -n : n;
}
const g = (a: number, b: number): number => (b ? g(b, a % b) : Math.abs(a));
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const P = (n: number, k: number) => fact(n) / fact(n - k);
const C = (n: number, k: number) => (k < 0 || k > n ? 0 : P(n, k) / fact(k));
function* perms<T>(items: T[], k: number): Generator<T[]> {
  if (k === 0) return yield [];
  for (let i = 0; i < items.length; i++) for (const rest of perms([...items.slice(0, i), ...items.slice(i + 1)], k - 1)) yield [items[i], ...rest];
}
function* combos<T>(items: T[], k: number, start = 0): Generator<T[]> {
  if (k === 0) return yield [];
  for (let i = start; i <= items.length - k; i++) for (const rest of combos(items, k - 1, i + 1)) yield [items[i], ...rest];
}

/**
 * The shown answer must equal `exact`. If it's rounded, the question must ask for that many decimal
 * places and the rounding must be right. No other option may have the same value.
 */
function expectAnswer(q: Question, exact: number, why = "") {
  const shown = value(q.options[q.answer]);
  const note = /to (\d) decimal place/.exec(q.prompt);
  const ctx = `${q.prompt} → ${q.options[q.answer]} (exact ${exact}) ${why}`;
  if (Math.abs(shown - exact) > 1e-9) {
    expect(note, `rounded without saying so: ${ctx}`).not.toBeNull();
    const d = Number(note![1]);
    expect(Math.abs(shown - Number(exact.toFixed(d))), `wrong rounding: ${ctx}`).toBeLessThan(1e-9);
  }
  for (const [i, o] of q.options.entries()) {
    if (i !== q.answer) expect(Math.abs(value(o) - shown) > 1e-9, `option "${o}" equals the answer: ${ctx}`).toBe(true);
  }
}
const expectFraction = (q: Question, num: number, den: number) => {
  const ans = q.options[q.answer];
  const [a, b] = ans.includes("/") ? ans.split("/").map(Number) : [Number(ans), 1];
  expect(g(a, b), `not in lowest terms: ${ans}`).toBe(1);
  expectAnswer(q, num / den);
};
const expectRatio = (q: Question, a: number, b: number) => {
  const [x, y] = q.options[q.answer].split(":").map(Number);
  expect(g(x, y), `ratio not in lowest terms: ${q.options[q.answer]}`).toBe(1);
  expect(x * b, q.prompt).toBe(y * a);
  for (const [i, o] of q.options.entries()) if (i !== q.answer) { const [u, v] = o.split(":").map(Number); expect(u * b === v * a, `option ${o} is also correct: ${q.prompt}`).toBe(false); }
};
/** Lengths, times, counts and money can't be zero or negative. */
const expectPositiveOptions = (q: Question) => {
  for (const o of q.options) expect(value(o) > 0, `nonsense option "${o}" in: ${q.prompt}`).toBe(true);
};

// ── One checker per generator, same order as the arrays in math-extra.ts ─────
type Check = (q: Question) => void;
const checks: Record<string, Check[]> = {
  percentExtras: [
    (q) => { const [s, k] = nums(q.prompt); expectAnswer(q, s / (1 + k / 100)); expectPositiveOptions(q); },
    (q) => { const [x] = nums(q.prompt); expectAnswer(q, (x / (100 + x)) * 100); expectPositiveOptions(q); },
    (q) => { const [w, a, b] = nums(q.prompt); expectAnswer(q, (w * a + (100 - w) * b) / 100); expectPositiveOptions(q); },
    (q) => { const [v, d, years] = nums(q.prompt); let x = v; for (let i = 0; i < years; i++) x -= (x * d) / 100; expectAnswer(q, x); expectPositiveOptions(q); },
  ],
  profitExtras: [
    (q) => { const [m, d1, d2] = nums(q.prompt); let p = 100 + m; p -= (p * d1) / 100; p -= (p * d2) / 100; expectAnswer(q, p - 100); },
    (q) => { const [p, sp, want] = nums(q.prompt); const cp = (sp * 100) / (100 + p); expectAnswer(q, cp + (cp * want) / 100); expectPositiveOptions(q); },
    (q) => { const [w1, p1, w2, p2, gain] = nums(q.prompt); const cost = (w1 * p1 + w2 * p2) / (w1 + w2); expectAnswer(q, cost * (1 + gain / 100)); expectPositiveOptions(q); },
  ],
  workExtras: [
    (q) => { const [fill, leak] = nums(q.prompt); expectAnswer(q, 1 / (1 / fill - 1 / leak)); expectPositiveOptions(q); },
    (q) => { const [a, b, c] = nums(q.prompt); expectAnswer(q, 1 / (1 / a + 1 / b - 1 / c)); expectPositiveOptions(q); },
    (q) => { const [x, bDays] = nums(q.prompt); expectAnswer(q, bDays / (1 + x / 100)); expectPositiveOptions(q); },
    (q) => { const [w, d, target] = nums(q.prompt); expectAnswer(q, (w * d) / target); expect(Number.isInteger((w * d) / target)).toBe(true); expectPositiveOptions(q); },
    (q) => { const [p, qq, days] = nums(q.prompt); expectAnswer(q, days / (p / qq)); expectPositiveOptions(q); },
  ],
  speedExtras: [
    (q) => { const [l1, l2, v1, v2] = nums(q.prompt); expectAnswer(q, (l1 + l2) / (((v1 + v2) * 1000) / 3600)); expectPositiveOptions(q); },
    (q) => { const [v1, late, v2, early] = nums(q.prompt); expectAnswer(q, (late + early) / 60 / (1 / v1 - 1 / v2)); expectPositiveOptions(q); },
    (q) => { const [x] = nums(q.prompt); expectAnswer(q, (1 - 1 / (1 + x / 100)) * 100); expectPositiveOptions(q); },
    (q) => { const [a, b, t] = nums(q.prompt); expectAnswer(q, (a * t) / 60 + (b * t) / 60); expectPositiveOptions(q); },
  ],
  ratioExtras: [
    (q) => {
      const [total, a, b, c, d] = nums(q.prompt);
      const milk = (total * a) / (a + b);
      const water = total - milk;
      expectAnswer(q, (milk * d) / c - water);
      expectPositiveOptions(q);
    },
    (q) => {
      const [v, x] = nums(q.prompt);
      let milk = v;
      for (let i = 0; i < (/twice/.test(q.prompt) ? 2 : 3); i++) milk -= x * (milk / v);
      expectAnswer(q, milk);
      expectPositiveOptions(q);
    },
    (q) => { const [p, qq, s, t] = nums(q.prompt); expectRatio(q, p * s, qq * t); },
    (q) => {
      const [a, b, k, , c] = nums(q.prompt);
      // Brute force: the smallest class (multiple of a+b) where adding k girls gives a:c.
      let found = 0;
      for (let x = 1; x < 500 && !found; x++) if (a * x * c === a * (b * x + k)) found = (a + b) * x;
      expect(found, q.prompt).toBeGreaterThan(0);
      expectAnswer(q, found);
      expect(g(a, c), `ratio ${a}:${c} not in lowest terms`).toBe(1);
    },
  ],
  numberExtras: [
    (q) => { const [base, exp, mod] = nums(q.prompt); expectAnswer(q, Number(BigInt(base) ** BigInt(exp) % BigInt(mod))); },
    (q) => {
      const ns = nums(q.prompt);
      let best = 0;
      for (let d = Math.max(...ns); d >= 2 && !best; d--) if (ns.every((n) => n % d === ns[0] % d)) best = d;
      expectAnswer(q, best);
    },
    (q) => {
      const [h, l, a] = nums(q.prompt);
      const b = value(q.options[q.answer]);
      expect([g(a, b), (a * b) / g(a, b)], q.prompt).toEqual([h, l]);
      expectAnswer(q, (h * l) / a);
    },
    (q) => { const [n, d] = nums(q.prompt); let add = 0; while ((n + add) % d) add++; expect(add).toBeGreaterThan(0); expectAnswer(q, add); },
  ],
  pncExtras: [
    (q) => {
      // Brute force: seat person 0 at seat 0 (rotations are the same), count arrangements with 0 and 1 adjacent.
      const [n] = nums(q.prompt);
      let count = 0;
      for (const p of perms(Array.from({ length: n - 1 }, (_, i) => i + 1), n - 1)) {
        const seats = [0, ...p];
        const i1 = seats.indexOf(1);
        if (i1 === 1 || i1 === n - 1) count++;
      }
      expectAnswer(q, count);
    },
    (q) => {
      const [m, , , k] = nums(q.prompt);
      let count = 0;
      for (const p of perms(Array.from({ length: k }, (_, i) => i + 1), m)) if (p[m - 1] === 5) count++;
      expectAnswer(q, count);
    },
    (q) => { const [x, a, y, b] = nums(q.prompt); expectAnswer(q, P(a, x) * P(b, y)); },
    (q) => {
      const [k, men, women] = nums(q.prompt);
      const people = [...Array(men).fill("M"), ...Array(women).fill("W")];
      let count = 0;
      for (const c of combos(people, k)) if (c.filter((x) => x === "W").length >= 2) count++;
      expectAnswer(q, count);
    },
  ],
  probExtras: [
    (q) => {
      const [n, k] = nums(q.prompt);
      let hits = 0;
      for (let o = 0; o < 6 ** n; o++) { let sixes = 0; for (let v = o, i = 0; i < n; i++, v = Math.floor(v / 6)) if (v % 6 === 5) sixes++; if (sixes === k) hits++; }
      expectFraction(q, hits, 6 ** n);
    },
    (q) => {
      const [d, good] = nums(q.prompt);
      const items = [...Array(d).fill("D"), ...Array(good).fill("G")];
      let hit = 0, all = 0;
      for (const c of combos(items, 2)) { all++; if (c.includes("D")) hit++; }
      expectFraction(q, hit, all);
    },
    (q) => {
      const deck = ["S", "H", "D", "C"].flatMap((s) => Array.from({ length: 13 }, (_, r) => ({ s, r })));
      const is = (c: { s: string; r: number }) =>
        /aces/.test(q.prompt) ? c.r === 0 : /kings/.test(q.prompt) ? c.r === 12 : /hearts/.test(q.prompt) ? c.s === "H" : /face cards/.test(q.prompt) ? c.r >= 10 : c.s === "H" || c.s === "D";
      let hit = 0, all = 0;
      for (let i = 0; i < 52; i++) for (let j = 0; j < 52; j++) if (i !== j) { all++; if (is(deck[i]) && is(deck[j])) hit++; }
      expectFraction(q, hit, all);
    },
  ],
  mensurationExtras: [
    (q) => { const [tsa] = nums(q.prompt); expectAnswer(q, Math.sqrt(tsa / 6) ** 3); expectPositiveOptions(q); },
    (q) => { const [l, b, h] = nums(q.prompt); expectAnswer(q, 2 * l * b + 2 * b * h + 2 * l * h); expectPositiveOptions(q); },
    (q) => {
      const [k] = nums(q.prompt);
      const hf = /doubled/.test(q.prompt) ? 2 : /halved/.test(q.prompt) ? 0.5 : 1;
      expectAnswer(q, (Math.PI * k * k * hf) / Math.PI);
      expectPositiveOptions(q);
    },
    (q) => { const [a, b] = nums(q.prompt); const c = Math.hypot(a, b); expectAnswer(q, (a * b) / (a + b + c)); expectPositiveOptions(q); },
    (q) => { const [per, d] = nums(q.prompt); const b = (per / 2 - d) / 2; expectAnswer(q, b * (b + d)); expectPositiveOptions(q); },
  ],
  interestExtras: [
    (q) => { const [t, r, si] = nums(q.prompt); expectAnswer(q, (si * 100) / (r * t)); expectPositiveOptions(q); },
    (q) => { const [amt, years, r] = nums(q.prompt); expectAnswer(q, amt / (1 + r / 100) ** years); expectPositiveOptions(q); },
  ],
  algebraGens: [
    (q) => {
      const k = nums(q.prompt)[1]; // "If x − 1/x = k, what is x² + 1/x²?" → [1, k, 2, 1, 2]
      const minus = q.prompt.includes("x − 1/x");
      const x = minus ? (k + Math.sqrt(k * k + 4)) / 2 : (k + Math.sqrt(k * k - 4)) / 2;
      expectAnswer(q, Number((x * x + 1 / (x * x)).toFixed(9)));
    },
    (q) => {
      const [p, qq, c, s] = nums(q.prompt.replace(/x|y/g, " ")); // "If px − qy = c and x + y = s" → [p, q, c, s]
      const x = (c + qq * s) / (p + qq);
      const y = s - x;
      expect(p * x - qq * y).toBeCloseTo(c);
      expectAnswer(q, x);
    },
    (q) => { const [s, p] = nums(q.prompt); expectAnswer(q, Math.sqrt(s * s - 4 * p)); },
    (q) => {
      const [k, s] = nums(q.prompt);
      const disc = Math.sqrt(s * s - 4 * k);
      const roots = [(s - disc) / 2, (s + disc) / 2].sort((a, b) => a - b);
      expect(nums(q.options[q.answer]).sort((a, b) => a - b), q.prompt).toEqual(roots);
      expect(roots.every((x) => x > 0)).toBe(true);
      for (const [i, o] of q.options.entries()) if (i !== q.answer) expect(nums(o).every((x) => Math.abs(x * x - s * x + k) < 1e-9), `option ${o} also solves it`).toBe(false);
    },
    (q) => {
      const [b, , d, n] = nums(q.prompt); // "log2(x) + log2(x − d) = n"
      const sols = Array.from({ length: 200 }, (_, i) => i - 50).filter((x) => x > d && x * (x - d) === b ** n);
      expect(sols, q.prompt).toHaveLength(1);
      expectAnswer(q, sols[0]);
    },
  ],
  progressionGens: [
    (q) => { const [m, tm, n, tn, k] = nums(q.prompt); const d = (tn - tm) / (n - m); expectAnswer(q, tm + (k - m) * d); },
    (q) => { const [n, k] = nums(q.prompt); let s = 0; for (let i = 1; i <= n; i++) s += k * i; expectAnswer(q, s); },
    (q) => { const [n, avg, a] = nums(q.prompt); expectAnswer(q, (2 * (avg - a)) / (n - 1)); },
    (q) => {
      const [c, mid] = nums(q.prompt);
      const lo = mid - (c - 1);
      const list = Array.from({ length: c }, (_, i) => lo + 2 * i);
      expect(list.reduce((a, b) => a + b, 0) / c).toBe(mid);
      expect(list.every((v) => v % 2 !== 0)).toBe(true);
      expectAnswer(q, list[0] * list[c - 1]);
    },
    (q) => {
      const t = nums(q.prompt);
      const p = (t[2] - t[1]) / (t[1] - t[0]);
      const c = t[1] - p * t[0];
      for (let i = 1; i < t.length; i++) expect(t[i], q.prompt).toBe(p * t[i - 1] + c);
      expectAnswer(q, p * t[t.length - 1] + c);
    },
  ],
};

describe("every new quant type: answer recomputed from the question text", () => {
  for (const [name, list] of Object.entries(checks)) {
    const gens = (X as unknown as Record<string, ((r: ReturnType<typeof rng>) => Question)[]>)[name];
    it(`${name}: ${gens.length} types × ${SEEDS} questions`, () => {
      expect(list).toHaveLength(gens.length); // a new generator must get a checker
      gens.forEach((gen, i) => {
        for (let seed = 1; seed <= SEEDS; seed++) list[i](gen(rng(seed * 31 + i)));
      });
    });
  }
});

// ── Data interpretation ───────────────────────────────────────────────────────
describe("data interpretation: answers recomputed from the table or chart shown", () => {
  it(`${SEEDS * 2} questions`, () => {
    for (let seed = 1; seed <= SEEDS * 2; seed++) {
      const q = generate(`m-di:${seed}`);
      if (q.chart?.kind === "pie") {
        const t = /\(total (₹?[\d,]+)( crore| students)?\)/.exec(q.chart.title)!;
        const total = nums(t[1])[0];
        const share = (name: string) => q.chart!.series[0].values[q.chart!.labels.indexOf(name)];
        const m1 = /(?:goes to|are in) ([\w&]+)\?/.exec(q.prompt);
        const m2 = /central angle of the ([\w&]+) sector/.exec(q.prompt);
        const m3 = /more (?:goes to|students are in) ([\w&]+) than (?:to|in) ([\w&]+)\?/.exec(q.prompt);
        const m4 = /ratio of ([\w&]+) to ([\w&]+)\?/.exec(q.prompt);
        if (m3) expectAnswer(q, (total * (share(m3[1]) - share(m3[2]))) / 100);
        else if (m1) expectAnswer(q, (total * share(m1[1])) / 100);
        else if (m2) expectAnswer(q, (share(m2[1]) / 100) * 360);
        else if (m4) expectRatio(q, share(m4[1]), share(m4[2]));
        else throw new Error(`unchecked pie question: ${q.prompt}`);
        continue;
      }
      // Series data, from the table or the chart.
      const labels = q.table ? q.table[0].slice(1) : q.chart!.labels;
      const series = new Map(q.table ? q.table.slice(1).map((r) => [r[0], r.slice(1).map(Number)] as const) : q.chart!.series.map((s) => [s.name, s.values] as const));
      const at = (name: string, label: string) => series.get(name)![labels.indexOf(label)];
      const totalAt = (label: string) => [...series.values()].reduce((a, v) => a + v[labels.indexOf(label)], 0);
      const sum = (name: string) => series.get(name)!.reduce((a, b) => a + b, 0);
      let m: RegExpExecArray | null;
      if ((m = /percentage change for (.+) from (\w+) to (\w+)\?/.exec(q.prompt))) expectAnswer(q, ((at(m[1], m[3]) - at(m[1], m[2])) / at(m[1], m[2])) * 100);
      else if ((m = /average for (.+) across/.exec(q.prompt))) expectAnswer(q, sum(m[1]) / labels.length);
      else if ((m = /ratio of (.+) to (.+) in (\w+)\?/.exec(q.prompt))) expectRatio(q, at(m[1], m[3]), at(m[2], m[3]));
      else if ((m = /combined total of .+ in (\w+) \(in/.exec(q.prompt))) expectAnswer(q, totalAt(m[1]));
      else if (/the highest\?/.test(q.prompt)) {
        const totals = labels.map(totalAt);
        expect(totals.filter((t) => t === Math.max(...totals))).toHaveLength(1);
        expect(q.options[q.answer]).toBe(labels[totals.indexOf(Math.max(...totals))]);
      } else if ((m = /combined total in (\w+) came from (.+)\?/.exec(q.prompt))) expectAnswer(q, (at(m[2], m[1]) / totalAt(m[1])) * 100);
      else if ((m = /total of (.+) differ from the total of (.+) across/.exec(q.prompt))) expectAnswer(q, Math.abs(sum(m[1]) - sum(m[2])));
      else throw new Error(`unchecked DI question: ${q.prompt}`);
    }
  });
});

// ── Data sufficiency ─────────────────────────────────────────────────────────
describe("data sufficiency: the right statement(s), whichever order they're shown in", () => {
  const [I_ALONE, II_ALONE, BOTH, EACH, NEITHER] = [0, 1, 2, 3, 4];
  /** Which statement is enough by itself, for families where one alone answers it. */
  const sufficientAlone: [RegExp, RegExp][] = [
    [/How old is Rahul/, /In \d+ years, Rahul will be/],
    [/price of one pen/, /^\d+ pens cost/],
    [/On which day was Tara born/, /born on a \w+, \d+ days? after her/],
  ];
  const expected: [RegExp, number][] = [
    [/What is the value of x\?[\s\S]*2x \+ 2y/, NEITHER],
    [/What is the value of x\?/, BOTH],
    [/How old is Priya/, BOTH],
    [/Is the integer n odd/, EACH],
    [/How many students are in the row/, BOTH],
    [/speed of the train/, BOTH],
    [/average speed of the car/, NEITHER],
    [/Is the number N divisible by/, BOTH],
    [/area of the rectangle/, BOTH],
    [/area of the circle/, EACH],
    [/Is x greater than y/, BOTH],
    [/price of one pen/, BOTH], // the "pens and pencils cost" family; the "pens cost" one is checked above
  ];
  it(`${SEEDS * 2} questions`, () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= SEEDS * 2; seed++) {
      const q = generate(`r-ds:${seed}`);
      const [, s1, s2] = /\nI\. (.+)\nII\. (.+)\n/.exec(q.prompt)!;
      seen.add(q.answer);
      const alone = sufficientAlone.find(([topic]) => topic.test(q.prompt));
      if (alone && !/2 pencils|pencils cost/.test(q.prompt)) {
        const inI = alone[1].test(s1);
        expect(inI || alone[1].test(s2), q.prompt).toBe(true);
        expect(q.answer, q.prompt).toBe(inI ? I_ALONE : II_ALONE);
        continue;
      }
      const rule = expected.find(([re]) => re.test(q.prompt));
      expect(rule, `unchecked DS family: ${q.prompt}`).toBeDefined();
      expect(q.answer, q.prompt).toBe(rule![1]);
      // Numbers inside the statements must agree with each other where they describe one situation.
      if (/speed of the train/.test(q.prompt)) {
        const plat = /crosses a (\d+) m platform in ([\d.]+) seconds/.exec(q.prompt)!;
        const pole = /crosses a pole in ([\d.]+) seconds/.exec(q.prompt)!;
        const v = Number(plat[1]) / (Number(plat[2]) - Number(pole[1]));
        expect(Number.isFinite(v) && v > 0, q.prompt).toBe(true);
      }
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});
