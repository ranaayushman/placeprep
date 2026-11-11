/**
 * More reasoning question types (standard tier) and hard versions for seating, syllogisms, blood
 * relations, ranking, direction and odd one out. Every answer is found by an exhaustive solver:
 * seating checks every arrangement, syllogisms every Venn diagram, blood relations walk the family tree.
 */
import { FAMILY_HARD, FAMILY_STANDARD } from "./family";
import { solveChain, type Step } from "./logic";
import { SYLL_OPTIONS, SYLL_TERMS } from "./reasoning";
import { mcq, rng, type Rng } from "./rng";
import type { Question } from "./types";

type Gen = (r: Rng) => Question;
const PEOPLE = ["Aman", "Bela", "Chirag", "Divya", "Esha", "Farhan", "Gita", "Harsh", "Isha", "Jatin", "Kavya", "Laksh"];
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

// ── Seating ─────────────────────────────────────────────────────────────────
type Clue = { text: string; ok: (o: string[]) => boolean };

/**
 * Circular table, everyone facing the centre. Seats are numbered clockwise; facing the centre, a
 * person's LEFT neighbour is the next seat clockwise.
 */
function circular(r: Rng, n: number, hardAsk: boolean): Question {
  for (;;) {
    const people = r.shuffle(PEOPLE).slice(0, n);
    const truth = r.shuffle(people);
    const at = (o: string[], p: string) => o.indexOf(p);
    const leftOf = (o: string[], p: string, k: number) => o[(at(o, p) + k) % n];
    const rightOf = (o: string[], p: string, k: number) => o[(at(o, p) - k + n * 4) % n];
    const dist = (o: string[], a: string, b: string) => Math.min((at(o, a) - at(o, b) + n) % n, (at(o, b) - at(o, a) + n) % n);
    const makeClue = (): Clue | null => {
      const [x, y] = r.shuffle(people);
      switch (r.int(0, 6)) {
        case 0: return leftOf(truth, x, 1) === y ? { text: `${y} sits immediately to the left of ${x}.`, ok: (o) => leftOf(o, x, 1) === y } : null;
        case 1: return rightOf(truth, x, 1) === y ? { text: `${y} sits immediately to the right of ${x}.`, ok: (o) => rightOf(o, x, 1) === y } : null;
        case 2: return leftOf(truth, x, 2) === y ? { text: `${y} sits second to the left of ${x}.`, ok: (o) => leftOf(o, x, 2) === y } : null;
        case 3: return rightOf(truth, x, 2) === y ? { text: `${y} sits second to the right of ${x}.`, ok: (o) => rightOf(o, x, 2) === y } : null;
        case 4: return n % 2 === 0 && dist(truth, x, y) === n / 2 ? { text: `${x} sits exactly opposite ${y}.`, ok: (o) => dist(o, x, y) === n / 2 } : null;
        case 5: return dist(truth, x, y) > 1 ? { text: `${x} is not an immediate neighbour of ${y}.`, ok: (o) => dist(o, x, y) > 1 } : null;
        default: return dist(truth, x, y) === 2 ? { text: `Exactly one person sits between ${x} and ${y} (on one side).`, ok: (o) => dist(o, x, y) === 2 } : null;
      }
    };
    // Rotations of the same order are the same seating: fix the first person in seat 0.
    let candidates = permutations(people.slice(1)).map((p) => [people[0], ...p]);
    const clues: Clue[] = [];
    for (let i = 0; i < 400 && candidates.length > 1 && clues.length < 9; i++) {
      const c = makeClue();
      if (!c) continue;
      const next = candidates.filter(c.ok);
      if (next.length < candidates.length) {
        clues.push(c);
        candidates = next;
      }
    }
    if (candidates.length !== 1 || clues.length < 3) continue;
    const order = candidates[0];
    const x = r.pick(people);
    let ask: string;
    let ans: string;
    if (hardAsk && n % 2 === 0) {
      const opp = order[(at(order, x) + n / 2) % n];
      const k = r.int(1, 2);
      const side = r.next() < 0.5 ? "left" : "right";
      ans = side === "left" ? leftOf(order, opp, k) : rightOf(order, opp, k);
      ask = `Who sits ${k === 1 ? "immediately" : "second"} to the ${side} of the person who sits opposite ${x}?`;
    } else {
      const kind = r.int(0, n % 2 === 0 ? 2 : 1);
      ans = kind === 0 ? leftOf(order, x, 1) : kind === 1 ? rightOf(order, x, 1) : order[(at(order, x) + n / 2) % n];
      ask = kind === 2 ? `Who sits opposite ${x}?` : `Who sits immediately to the ${kind === 0 ? "left" : "right"} of ${x}?`;
    }
    const clockwise = order.join(" → ");
    return mcq(r, {
      prompt: `${n} friends — ${[...people].sort().join(", ")} — sit around a circular table, all facing the centre.\n${clues.map((c) => `• ${c.text}`).join("\n")}\n${ask}`,
      correct: ans,
      distractors: r.shuffle(people.filter((p) => p !== ans)),
      explanation: `Facing the centre, your left is the next seat clockwise. The only seating that satisfies every clue, read clockwise, is: ${clockwise} (then back to ${order[0]}). So the answer is ${ans}. Trap: mixing up left and right — they flip compared with people facing outward.`,
    });
  }
}

/** Six people in a row facing north (left end = west). */
function linearSix(r: Rng): Question {
  for (;;) {
    const people = r.shuffle(PEOPLE).slice(0, 6);
    const truth = r.shuffle(people);
    const at = (o: string[], p: string) => o.indexOf(p);
    const makeClue = (): Clue | null => {
      const [x, y] = r.shuffle(people);
      const [px, py] = [at(truth, x), at(truth, y)];
      switch (r.int(0, 5)) {
        case 0: return py === px + 1 ? { text: `${y} sits immediately to the right of ${x}.`, ok: (o) => at(o, y) === at(o, x) + 1 } : null;
        case 1: return Math.abs(px - py) >= 3 ? { text: `Exactly ${Math.abs(px - py) - 1} people sit between ${x} and ${y}.`, ok: (o) => Math.abs(at(o, x) - at(o, y)) === Math.abs(px - py) } : null;
        case 2: return px === 0 || px === 5 ? { text: `${x} sits at one of the ends.`, ok: (o) => at(o, x) === 0 || at(o, x) === 5 } : null;
        case 3: return Math.abs(px - py) > 1 ? { text: `${x} does not sit next to ${y}.`, ok: (o) => Math.abs(at(o, x) - at(o, y)) > 1 } : null;
        case 4: return px < py ? { text: `${x} sits somewhere to the left of ${y}.`, ok: (o) => at(o, x) < at(o, y) } : null;
        default: return px === 1 || px === 4 ? { text: `${x} sits second from the ${px === 1 ? "left" : "right"} end.`, ok: (o) => at(o, x) === px } : null;
      }
    };
    let candidates = permutations(people);
    const clues: Clue[] = [];
    for (let i = 0; i < 400 && candidates.length > 1 && clues.length < 10; i++) {
      const c = makeClue();
      if (!c) continue;
      const next = candidates.filter(c.ok);
      if (next.length < candidates.length) {
        clues.push(c);
        candidates = next;
      }
    }
    if (candidates.length !== 1 || clues.length < 4) continue;
    const order = candidates[0];
    const [x, y] = r.shuffle(people);
    const between = Math.abs(at(order, x) - at(order, y)) - 1;
    const askBetween = r.next() < 0.5;
    const pos = r.int(0, 5);
    const where = ["at the extreme left", "second from the left", "third from the left", "third from the right", "second from the right", "at the extreme right"][pos];
    return mcq(r, {
      prompt: `Six people — ${[...people].sort().join(", ")} — sit in a row facing north.\n${clues.map((c) => `• ${c.text}`).join("\n")}\n${askBetween ? `How many people sit between ${x} and ${y}?` : `Who sits ${where}?`}`,
      correct: askBetween ? String(between) : order[pos],
      distractors: askBetween ? ["0", "1", "2", "3", "4"].filter((v) => v !== String(between)) : people.filter((p) => p !== order[pos]),
      explanation: `The only order (left → right) that satisfies every clue is: ${order.join(", ")}. ${askBetween ? `${between} people sit between ${x} and ${y}.` : `${order[pos]} sits ${where}.`}`,
    });
  }
}

// ── Syllogisms (any number of terms, exact) ─────────────────────────────────
type Form = "A" | "E" | "I" | "O";
type P = { f: Form; s: number; p: number; possible?: boolean };
const diagramCache = new Map<number, number[]>();
/** Every Venn diagram over `t` terms with each term non-empty, as bitmasks of present regions. */
function diagrams(t: number) {
  if (!diagramCache.has(t)) {
    const regions = (1 << t) - 1; // region r (1..2^t − 1): bit k set ⇒ inside term k
    const termMask = Array.from({ length: t }, (_, k) => Array.from({ length: regions }, (_, i) => i + 1).filter((rg) => (rg >> k) & 1).reduce((m, rg) => m | (1 << (rg - 1)), 0));
    const out: number[] = [];
    for (let m = 1; m < 1 << regions; m++) if (termMask.every((tm) => m & tm)) out.push(m);
    diagramCache.set(t, out);
  }
  return diagramCache.get(t)!;
}
function propMasks({ f, s, p }: P, t: number) {
  let both = 0;
  let sNotP = 0;
  for (let rg = 1; rg < 1 << t; rg++) {
    const inS = (rg >> s) & 1;
    const inP = (rg >> p) & 1;
    if (inS && inP) both |= 1 << (rg - 1);
    if (inS && !inP) sNotP |= 1 << (rg - 1);
  }
  return f === "A" ? { forbid: sNotP, need: 0 } : f === "E" ? { forbid: both, need: 0 } : f === "I" ? { forbid: 0, need: both } : { forbid: 0, need: sNotP };
}
type Masks = { forbid: number; need: number };
const ok = ({ forbid, need }: Masks, d: number) => (d & forbid) === 0 && (need === 0 || (d & need) !== 0);
/** Diagrams consistent with all statements (computed once per statement set). */
const fitting = (st: P[], t: number) => {
  const ms = st.map((x) => propMasks(x, t));
  return diagrams(t).filter((d) => ms.every((m) => ok(m, d)));
};
/** 0 only I, 1 only II, 2 both, 3 neither, 4 either-or (exactly one is true in every case). Possibility conclusions follow if some diagram allows them. */
function solve(fits: number[], t: number, c1: P, c2: P) {
  const [m1, m2] = [propMasks(c1, t), propMasks(c2, t)];
  const follows = (c: P, m: Masks) => (c.possible ? fits.some((d) => ok(m, d)) : fits.every((d) => ok(m, d)));
  const [f1, f2] = [follows(c1, m1), follows(c2, m2)];
  if (f1 && f2) return 2;
  if (f1) return 0;
  if (f2) return 1;
  if (!c1.possible && !c2.possible && fits.every((d) => ok(m1, d) !== ok(m2, d))) return 4;
  return 3;
}
function say({ f, s, p, possible }: P, terms: string[]) {
  const [x, y] = [terms[s], terms[p]];
  if (possible) return f === "A" ? `All ${x} being ${y} is a possibility.` : f === "E" ? `No ${x} being ${y} is a possibility.` : f === "I" ? `Some ${x} being ${y} is a possibility.` : `Some ${x} not being ${y} is a possibility.`;
  return f === "A" ? `All ${x} are ${y}.` : f === "E" ? `No ${x} are ${y}.` : f === "I" ? `Some ${x} are ${y}.` : `Some ${x} are not ${y}.`;
}
function syllogismQ(r: Rng, t: 3 | 4, possibleShare: number): Question {
  const target = r.pick([0, 0, 1, 1, 2, 2, 3, 3, 4]);
  const form = (): Form => r.pick(["A", "A", "E", "I", "I", "O"] as const);
  let best: { st: P[]; c: [P, P]; ans: number } | null = null;
  outer: for (let sets = 0; sets < 25; sets++) {
    // A chain of statements: term 0–1, 1–2 (and 2–3), each pair in a random order.
    const st: P[] = Array.from({ length: t - 1 }, (_, i) => (r.next() < 0.5 ? { f: form(), s: i, p: i + 1 } : { f: form(), s: i + 1, p: i }));
    const fits = fitting(st, t);
    if (!fits.length) continue;
    for (let tries = 0; tries < 25; tries++) {
      const conc = (): P => {
        const [a, b] = r.shuffle(Array.from({ length: t }, (_, i) => i)).slice(0, 2);
        return { f: form(), s: a, p: b, possible: r.next() < possibleShare };
      };
      const c: [P, P] = [conc(), conc()];
      const same = (x: P, y: P) => x.f === y.f && x.s === y.s && x.p === y.p && !!x.possible === !!y.possible;
      if (same(c[0], c[1]) || c.some((x) => st.some((y) => same(x, y)))) continue;
      const ans = solve(fits, t, c[0], c[1]);
      if (!best || ans === target) best = { st, c, ans };
      if (ans === target) break outer;
    }
  }
  const { st, c, ans } = best!;
  const terms = r.shuffle(SYLL_TERMS).slice(0, t);
  const [c1, c2] = c.map((x) => say(x, terms));
  const why = (x: P, ok: boolean) =>
    x.possible ? (ok ? "is possible: at least one diagram fits the statements and makes it true" : "is impossible: no diagram that fits the statements makes it true") : ok ? "is certain: it holds in every diagram that fits" : "is not certain: some diagram fits the statements but breaks it";
  return {
    kind: "mcq",
    prompt: `Statements:\n${st.map((x, i) => `${i + 1}. ${say(x, terms)}`).join("\n")}\nConclusions:\nI. ${c1}\nII. ${c2}\nWhich conclusion(s) follow?`,
    options: SYLL_OPTIONS,
    answer: ans,
    explanation:
      ans === 4
        ? `Neither conclusion is certain alone, but they are opposite claims about the same groups, so exactly one of them is always true.`
        : `Conclusion I ${why(c[0], ans === 0 || ans === 2)}. Conclusion II ${why(c[1], ans === 1 || ans === 2)}. A "possibility" conclusion follows if the statements don't rule it out; a plain conclusion needs to be true in every case.`,
  };
}

// ── Blood relations: coded operators ────────────────────────────────────────
const MEANINGS: { word: string; step: Step; male: boolean }[] = [
  { word: "father", step: "parent", male: true },
  { word: "mother", step: "parent", male: false },
  { word: "brother", step: "sibling", male: true },
  { word: "sister", step: "sibling", male: false },
  { word: "son", step: "child", male: true },
  { word: "daughter", step: "child", male: false },
];
const SYMBOLS = ["+", "−", "×", "÷", "$", "#", "@", "%"];
function codedSetup(r: Rng) {
  const syms = r.shuffle(SYMBOLS).slice(0, 6);
  const table = MEANINGS.map((m, i) => ({ ...m, sym: syms[i] }));
  const legend = r.shuffle(table).map((m) => `'A ${m.sym} B' means 'A is the ${m.word} of B'`).join("; ");
  return { table, legend };
}
function evalExpr(ops: (typeof MEANINGS[number] & { sym: string })[]) {
  return solveChain(ops.map((o) => o.step), ops[0].male);
}
const bloodCoded: Gen = (r) => {
  for (;;) {
    const { table, legend } = codedSetup(r);
    const ops = Array.from({ length: r.int(2, 3) }, () => r.pick(table));
    const res = evalExpr(ops);
    if (!res) continue;
    const letters = ["P", "Q", "R", "S"].slice(0, ops.length + 1);
    const expr = letters.map((l, i) => (i < ops.length ? `${l} ${ops[i].sym} ` : l)).join("");
    const pool = ops[0].male ? ["father", "grandfather", "son", "grandson", "brother", "uncle", "nephew", "cousin"] : ["mother", "grandmother", "daughter", "granddaughter", "sister", "aunt", "niece", "cousin"];
    const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
    return mcq(r, {
      prompt: `${legend}.\nIf ${expr}, how is P related to ${letters.at(-1)}?`,
      correct: cap(res.relation),
      distractors: r.shuffle(pool.filter((w) => w !== res.relation)).map(cap),
      explanation: `Read it left to right: ${ops.map((o, i) => `${letters[i]} is the ${o.word} of ${letters[i + 1]}`).join("; ")}. Drawing the tree, P is ${letters.at(-1)}'s ${res.relation}.`,
    });
  }
};
const bloodWhichExpr: Gen = (r) => {
  for (;;) {
    const { table, legend } = codedSetup(r);
    const make = () => Array.from({ length: 3 }, () => r.pick(table));
    const ops = make();
    const res = evalExpr(ops);
    if (!res) continue;
    const fmt = (o: typeof ops) => `P ${o[0].sym} Q ${o[1].sym} R ${o[2].sym} S`;
    const wrong: string[] = [];
    for (let i = 0; i < 300 && wrong.length < 3; i++) {
      const w = make();
      const rr = evalExpr(w);
      if (rr && rr.relation !== res.relation && !wrong.includes(fmt(w)) && fmt(w) !== fmt(ops)) wrong.push(fmt(w));
    }
    if (wrong.length < 3) continue;
    return mcq(r, {
      prompt: `${legend}.\nWhich of the following means that P is the ${res.relation} of S?`,
      correct: fmt(ops),
      distractors: wrong,
      explanation: `${fmt(ops)}: ${ops.map((o, i) => `${"PQRS"[i]} is the ${o.word} of ${"PQRS"[i + 1]}`).join("; ")} — so P is S's ${res.relation}. Each other option leads to a different relation; check one link at a time.`,
    });
  }
};

// ── Ranking ─────────────────────────────────────────────────────────────────
const rankExtras: Gen[] = [
  (r) => {
    const [a, b] = r.shuffle(PEOPLE).slice(0, 2);
    const [la, rb, gap] = [r.int(5, 20), r.int(5, 20), r.int(2, 8)];
    const total = la + gap + rb;
    return mcq(r, {
      prompt: `In a row of children, ${a} is ${ordinal(la)} from the left and ${b} is ${ordinal(rb)} from the right. ${a} is to the left of ${b}, and there are ${gap} children between them. How many children are in the row?`,
      correct: String(total),
      distractors: [String(total - 1), String(total + 1), String(la + rb), String(la + rb - gap - 2)],
      explanation: `They do not overlap: ${la} (up to ${a}) + ${gap} between + ${rb} (from ${b} to the right end) = ${total}.`,
    });
  },
  (r) => {
    const [a, b] = r.shuffle(PEOPLE).slice(0, 2);
    const [la, rb] = [r.int(5, 15), r.int(5, 15)];
    const newLa = r.int(la + 3, la + 15);
    const total = newLa + rb - 1;
    return mcq(r, {
      prompt: `In a row, ${a} is ${ordinal(la)} from the left end and ${b} is ${ordinal(rb)} from the right end. They swap places, and ${a} is now ${ordinal(newLa)} from the left end. How many people are in the row?`,
      correct: String(total),
      distractors: [String(newLa + rb), String(la + rb - 1), String(newLa + rb + 1), String(newLa + la - 1)],
      explanation: `After swapping, ${a} stands where ${b} stood, which is ${ordinal(rb)} from the right. So ${a} is ${ordinal(newLa)} from the left and ${ordinal(rb)} from the right: ${newLa} + ${rb} − 1 = ${total}.`,
    });
  },
  (r) => {
    const name = r.pick(PEOPLE);
    const [top, bottom, failed, absent] = [r.int(5, 20), r.int(10, 40), r.int(2, 9), r.int(1, 6)];
    const total = top + bottom - 1 + failed + absent;
    return mcq(r, {
      prompt: `Among the students who passed, ${name} ranks ${ordinal(top)} from the top and ${ordinal(bottom)} from the bottom. ${failed} students failed and ${absent} were absent. How many students are in the class?`,
      correct: String(total),
      distractors: [String(top + bottom - 1), String(top + bottom + failed + absent), String(total - absent), String(total - failed)],
      explanation: `Passed = ${top} + ${bottom} − 1 = ${top + bottom - 1}. Add those who failed (${failed}) and were absent (${absent}): ${total}.`,
    });
  },
];
const rankHard: Gen[] = [
  (r) => {
    const [a, b] = r.shuffle(PEOPLE).slice(0, 2);
    for (;;) {
      const N = r.int(25, 60);
      const pa = r.int(3, N - 3);
      const pb = r.int(3, N - 3);
      if (Math.abs(pa - pb) < 3) continue;
      // After swapping, a stands at pb.
      const between = Math.abs(pa - pb) - 1;
      return mcq(r, {
        prompt: `In a row of ${N} students, ${a} is ${ordinal(pa)} from the left. ${b} is ${ordinal(N - pb + 1)} from the right. If they swap places, what will ${a}'s position be from the right end, and how many students sit between them?`,
        correct: `${ordinal(N - pb + 1)} from the right; ${between} between`,
        distractors: [`${ordinal(N - pa + 1)} from the right; ${between} between`, `${ordinal(N - pb + 1)} from the right; ${between + 1} between`, `${ordinal(pb)} from the right; ${between} between`, `${ordinal(N - pb)} from the right; ${between - 1} between`],
        explanation: `${b} is at position ${N} − ${N - pb + 1} + 1 = ${pb} from the left. After the swap ${a} takes that place, which is ${ordinal(N - pb + 1)} from the right. The people between them don't change: |${pa} − ${pb}| − 1 = ${between}.`,
      });
    }
  },
  (r) => {
    // Overlapping case: two counts that share people.
    const [a, b] = r.shuffle(PEOPLE).slice(0, 2);
    for (;;) {
      const N = r.int(20, 45);
      const pa = r.int(2, N - 1); // a from left
      const pb = r.int(2, pa - 1 > 2 ? pa - 1 : 2); // b is to the LEFT of a
      if (pb >= pa) continue;
      const la = pa;
      const rb = N - pb + 1;
      return mcq(r, {
        prompt: `In a row, ${a} is ${ordinal(la)} from the left end and ${b} is ${ordinal(rb)} from the right end. ${b} is to the left of ${a}, and there are ${pa - pb - 1} people between them. How many people are in the row?`,
        correct: String(N),
        distractors: [String(la + rb + (pa - pb - 1)), String(la + rb - 1), String(N + 1), String(N - 1)],
        explanation: `${b} is to the left of ${a}, so the two counts overlap. Total = ${la} + ${rb} − (people counted twice). The overlap is ${b} through ${a}: ${pa - pb - 1} between + 2 = ${pa - pb + 1}. So ${la} + ${rb} − ${pa - pb + 1} = ${N}. Trap: adding the gap as if they didn't overlap.`,
      });
    }
  },
];

// ── Direction (hard): positions relative to several people ──────────────────
const DIRS: Record<string, [number, number]> = { north: [0, 1], south: [0, -1], east: [1, 0], west: [-1, 0] };
const directionHard: Gen = (r) => {
  for (;;) {
    const names = ["P", "Q", "R", "S", "T"];
    const pos = new Map<string, [number, number]>([["P", [0, 0]]]);
    const lines: string[] = [];
    for (let i = 1; i < names.length; i++) {
      const ref = names[r.int(0, i - 1)];
      const [d, v] = r.pick(Object.entries(DIRS));
      const len = r.int(2, 12);
      const [x, y] = pos.get(ref)!;
      pos.set(names[i], [x + v[0] * len, y + v[1] * len]);
      lines.push(`${names[i]} is ${len} m ${d} of ${ref}.`);
    }
    const [a, b] = r.shuffle(names).slice(0, 2);
    const [ax, ay] = pos.get(a)!;
    const [bx, by] = pos.get(b)!;
    const [dx, dy] = [bx - ax, by - ay];
    const dist = Math.hypot(dx, dy);
    if (!Number.isInteger(dist) || dx === 0 || dy === 0) continue;
    if (lines.some((l) => l.startsWith(`${b} is`) && l.endsWith(`of ${a}.`))) continue; // not given directly
    const dir = `${dy > 0 ? "North" : "South"}-${dx > 0 ? "East" : "West"}`;
    return mcq(r, {
      prompt: `${r.shuffle(lines).join(" ")}\nHow far is ${b} from ${a}, and in which direction?`,
      correct: `${dist} m, ${dir}`,
      distractors: [`${dist} m, ${dy > 0 ? "South" : "North"}-${dx > 0 ? "West" : "East"}`, `${Math.abs(dx) + Math.abs(dy)} m, ${dir}`, `${dist} m, ${dy > 0 ? "North" : "South"}-${dx > 0 ? "West" : "East"}`, `${dist + 1} m, ${dir}`],
      explanation: `Place P at (0, 0) and work out each person's position from the statements. ${a} is at (${ax}, ${ay}) and ${b} at (${bx}, ${by}), so ${b} is ${Math.abs(dx)} m ${dx > 0 ? "east" : "west"} and ${Math.abs(dy)} m ${dy > 0 ? "north" : "south"} of ${a}: √(${dx * dx} + ${dy * dy}) = ${dist} m, ${dir}. Trap: the direction of ${b} from ${a} is the reverse of ${a} from ${b}.`,
    });
  }
};

// ── Odd one out (hard): near-misses that look like they belong ──────────────
const FAMILIES: { name: string; members: number[] }[] = [
  { name: "products of two consecutive numbers (n × (n + 1))", members: [6, 12, 20, 30, 42, 56, 72, 90, 110, 132, 156] },
  { name: "one more than a perfect square (n² + 1)", members: [5, 10, 17, 26, 37, 50, 65, 82, 101, 122, 145] },
  { name: "one less than a perfect cube (n³ − 1)", members: [7, 26, 63, 124, 215, 342, 511, 728] },
  { name: "squares of prime numbers", members: [4, 9, 25, 49, 121, 169, 289, 361] },
  { name: "numbers whose digits add up to 10", members: [19, 28, 37, 46, 55, 64, 73, 82, 91, 109, 118, 127] },
  { name: "prime numbers", members: [41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103] },
];
const oddHard: Gen = (r) => {
  for (;;) {
    const fam = r.pick(FAMILIES);
    const three = r.shuffle(fam.members).slice(0, 3);
    // For primes the impostor must look prime too (odd, not obviously divisible): 91, 119, 133 …
    const near = fam.name === "prime numbers" ? r.pick([49, 77, 91, 119, 121, 133, 143, 161, 169, 187, 203, 209, 217, 221]) : r.pick(fam.members) + r.pick([-2, -1, 1, 2]);
    if (near <= 1 || fam.members.includes(near) || three.includes(near)) continue;
    // The odd one must also fail the property for numbers beyond the listed members.
    const isMember = (n: number) => {
      const s = Math.round(Math.sqrt(n));
      const c = Math.round(Math.cbrt(n + 1));
      const isPrime = (k: number) => k > 1 && Array.from({ length: Math.floor(Math.sqrt(k)) - 1 }, (_, i) => i + 2).every((d) => k % d);
      switch (fam.name[0] + fam.name[1]) {
        case "pr": return fam.name.startsWith("products") ? Number.isInteger((Math.sqrt(4 * n + 1) - 1) / 2) : isPrime(n);
        case "on": return fam.name.includes("square") ? (s - 1) ** 2 + 1 === n || s * s + 1 === n || (s + 1) ** 2 + 1 === n : c ** 3 - 1 === n;
        case "sq": return s * s === n && isPrime(s);
        default: return String(n).split("").reduce((a, d) => a + Number(d), 0) === 10;
      }
    };
    if (isMember(near)) continue;
    return mcq(r, {
      prompt: "Find the odd one out:",
      correct: String(near),
      distractors: three.map(String),
      explanation: `${three.join(", ")} are all ${fam.name}. ${near} is not, even though it is close to one of them.`,
    });
  }
};

/** Extra standard-tier templates (mixed in with the original generator). */
export const REASONING_VARIETY: Record<string, Gen[]> = {
  "r-seating": [(r) => circular(r, r.pick([6, 6, 8]), false), linearSix],
  "r-syllogism": [(r) => syllogismQ(r, 3, 0.5)],
  // Coded symbols are one format among six (plus the original generator), not most of the set.
  "r-blood": [...FAMILY_STANDARD, bloodCoded],
  "r-ranking": rankExtras,
};

/** Hard-tier generators. */
const pickGen = (gens: Gen[]) => (seed: number) => {
  const r = rng((seed ^ 0x7feb352d) >>> 0);
  return gens[r.int(0, gens.length - 1)](r);
};
export const REASONING_HARD: Record<string, (seed: number) => Question> = {
  "r-seating": pickGen([(r) => circular(r, 8, true), (r) => circular(r, 6, true)]),
  "r-syllogism": pickGen([(r) => syllogismQ(r, 4, 0.5), (r) => syllogismQ(r, 4, 0)]),
  "r-blood": pickGen([...FAMILY_HARD, bloodWhichExpr]),
  "r-ranking": pickGen(rankHard),
  "r-direction": pickGen([directionHard]),
  "r-odd": pickGen([oddHard]),
};
