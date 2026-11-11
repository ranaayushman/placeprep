/**
 * Hard tier for the remaining Math, Pseudocode and Puzzle topics. Same rules as hard.ts: multi-step
 * questions, wrong options from named mistakes, answers computed (puzzles by exhaustive search).
 */
import { fmt, fraction, gcd, mcq, rng, type Rng } from "./rng";
import { solveAddition } from "./puzzle";
import type { Question } from "./types";

type Gen = (r: Rng) => Question;
const pick = (gens: Gen[], salt: number) => (seed: number) => {
  const r = rng((seed ^ salt) >>> 0);
  return gens[r.int(0, gens.length - 1)](r);
};
function attempt<T>(build: () => T | null): T {
  for (let i = 0; i < 2000; i++) {
    const v = build();
    if (v) return v;
  }
  throw new Error("no valid parameters");
}
const inr = (n: number) => n.toLocaleString("en-IN");
const rs = (n: number) => `₹${inr(n)}`;
const pc = (x: number) => `${fmt(x)}%`;
/** Negative numbers with a typographic minus, as printed in papers. */
const num = (n: number) => (n < 0 ? `−${fmt(-n)}` : fmt(n));
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ── Profit & loss ───────────────────────────────────────────────────────────
const profitHard: Gen[] = [
  (r) => {
    const v = attempt(() => {
      const w = r.pick([800, 850, 900, 950, 960]);
      const markup = r.pick([0, 5, 10, 20]);
      const profit = ((1000 * (100 + markup)) / w - 100);
      return Number.isFinite(profit) ? { w, markup, profit } : null;
    });
    return mcq(r, {
      prompt: `A shopkeeper claims to sell rice at ${v.markup ? `${v.markup}% above` : ""}${v.markup ? " " : ""}cost price${v.markup ? "" : " (no profit)"}, but uses a false weight of ${v.w} g instead of 1 kg. What is his actual profit percentage?${Number.isInteger(v.profit * 100) ? "" : " (to 2 decimal places)"}`,
      correct: pc(v.profit),
      distractors: [pc(v.markup + (1000 - v.w) / 10), pc(((1000 - v.w) / 1000) * 100 + v.markup), pc(v.profit + 1), pc(((1000 - v.w) / v.w) * 100)].filter((x) => x !== pc(v.profit)),
      explanation: `He gives ${v.w} g but charges for 1000 g${v.markup ? ` at ${100 + v.markup}% of cost` : ""}. Profit = (1000 × ${(100 + v.markup) / 100} − ${v.w}) / ${v.w} × 100 = ${pc(v.profit)}. Trap: dividing by 1000 instead of the ${v.w} g he actually gives.`,
    });
  },
  (r) => {
    const v = attempt(() => {
      const x = r.pick([10, 12, 15, 20, 25]);
      const SP = r.int(10, 99) * 100;
      const cp1 = (SP * 100) / (100 + x);
      const cp2 = (SP * 100) / (100 - x);
      const loss = cp1 + cp2 - 2 * SP;
      return Number.isInteger(cp1) && Number.isInteger(cp2) ? { x, SP, loss } : null;
    });
    return mcq(r, {
      prompt: `A trader sells two phones for ${rs(v.SP)} each. On one he gains ${v.x}% and on the other he loses ${v.x}%. What is his overall gain or loss?`,
      correct: `Loss of ${rs(v.loss)}`,
      distractors: ["No gain, no loss", `Gain of ${rs(v.loss)}`, `Loss of ${rs((2 * v.SP * v.x * v.x) / 10000)}`, `Loss of ${rs(v.loss + 100)}`],
      explanation: `Equal selling prices with ±${v.x}% always give a loss of (${v.x}²/100)% = ${fmt((v.x * v.x) / 100)}% of the cost. Cost prices: ${rs((v.SP * 100) / (100 + v.x))} and ${rs((v.SP * 100) / (100 - v.x))}; total cost ${rs(2 * v.SP + v.loss)} vs revenue ${rs(2 * v.SP)} → loss ${rs(v.loss)}. Trap: "they cancel out".`,
    });
  },
  (r) => {
    const v = attempt(() => {
      const [d1, d2, p] = [r.pick([10, 15, 20, 25]), r.pick([5, 10, 20]), r.pick([8, 10, 12, 15, 20, 26])];
      const factor = (1 - d1 / 100) * (1 - d2 / 100);
      const mark = ((100 + p) / factor - 100);
      return Math.abs(mark * 100 - Math.round(mark * 100)) < 1e-9 ? { d1, d2, p, mark } : null;
    });
    return mcq(r, {
      prompt: `A shopkeeper wants a ${v.p}% profit after giving two successive discounts of ${v.d1}% and ${v.d2}%. By what percentage above cost price should he mark the goods?`,
      correct: pc(v.mark),
      distractors: [pc(v.p + v.d1 + v.d2), pc(v.p + v.d1 + v.d2 - (v.d1 * v.d2) / 100), pc(v.mark + 5), pc(((100 + v.p) / (1 - (v.d1 + v.d2) / 100)) - 100)],
      explanation: `Marked price × ${(100 - v.d1) / 100} × ${(100 - v.d2) / 100} = cost × ${(100 + v.p) / 100}. So marked = cost × ${fmt((100 + v.p) / ((100 - v.d1) * (100 - v.d2) / 100))}, i.e. ${pc(v.mark)} above cost. Trap: adding the percentages.`,
    });
  },
];

// ── Ratio, ages, mixtures, partnership ──────────────────────────────────────
const ratioHard: Gen[] = [
  (r) => {
    const v = attempt(() => {
      const [a, b] = [r.int(2, 12) * 5000, r.int(2, 12) * 5000];
      const m = r.int(2, 8);
      const total = r.int(5, 40) * 1000;
      const [wa, wb] = [a * 12, b * (12 - m)];
      const share = (total * wb) / (wa + wb);
      return Number.isInteger(share) ? { a, b, m, total, share, wa, wb } : null;
    });
    return mcq(r, {
      prompt: `A starts a business with ${rs(v.a)}. ${v.m} months later B joins with ${rs(v.b)}. At the end of the year the profit is ${rs(v.total)}. What is B's share?`,
      correct: rs(v.share),
      distractors: [rs(Math.round((v.total * v.b) / (v.a + v.b))), rs(v.total - v.share), rs(Math.round((v.total * v.b * v.m) / (v.a * 12 + v.b * v.m))), rs(v.share + 1000)],
      explanation: `Shares go by money × months: A ${inr(v.a)} × 12 = ${inr(v.wa)}, B ${inr(v.b)} × ${12 - v.m} = ${inr(v.wb)}. B gets ${inr(v.wb)}/${inr(v.wa + v.wb)} × ${inr(v.total)} = ${rs(v.share)}. Trap: ignoring the months B was not in the business.`,
    });
  },
  (r) => {
    const v = attempt(() => {
      const [p1, p2] = [r.int(20, 60), r.int(61, 120)];
      const mean = r.int(p1 + 1, p2 - 1);
      const [x, y] = [p2 - mean, mean - p1];
      const g = gcd(x, y);
      return p2 - p1 >= 12 && x !== y && x / g <= 12 && y / g <= 12 ? { p1, p2, mean, x: x / g, y: y / g } : null;
    });
    return mcq(r, {
      prompt: `In what ratio must tea costing ₹${v.p1}/kg be mixed with tea costing ₹${v.p2}/kg so that the mixture costs ₹${v.mean}/kg?`,
      correct: `${v.x} : ${v.y}`,
      distractors: [`${v.y} : ${v.x}`, `${v.p1} : ${v.p2}`, `${v.x + 1} : ${v.y}`, `${v.x} : ${v.y + 1}`],
      explanation: `Alligation: cheaper : dearer = (${v.p2} − ${v.mean}) : (${v.mean} − ${v.p1}) = ${v.p2 - v.mean} : ${v.mean - v.p1} = ${v.x} : ${v.y}. Trap: putting the differences the wrong way round.`,
    });
  },
  (r) => {
    const v = attempt(() => {
      const [a, b] = [r.int(10, 50), r.int(10, 50)];
      const [t1, t2] = [r.int(3, 10), r.int(3, 10)];
      const g1 = gcd(a - t1, b - t1);
      const g2 = gcd(a + t2, b + t2);
      if (a === b || a - t1 <= 0 || b - t1 <= 0) return null;
      return { a, b, t1, t2, r1: [(a - t1) / g1, (b - t1) / g1], r2: [(a + t2) / g2, (b + t2) / g2] };
    });
    if (v.r1[0] === v.r2[0] && v.r1[1] === v.r2[1]) return ratioHard[2](r);
    return mcq(r, {
      prompt: `${v.t1} years ago, the ratio of the ages of Ravi and Meera was ${v.r1[0]} : ${v.r1[1]}. ${v.t2} years from now it will be ${v.r2[0]} : ${v.r2[1]}. What is Ravi's present age?`,
      correct: `${v.a} years`,
      distractors: [`${v.b} years`, `${v.a - v.t1} years`, `${v.a + v.t2} years`, `${v.a + 1} years`],
      explanation: `Let the ages ${v.t1} years ago be ${v.r1[0]}k and ${v.r1[1]}k. Then (${v.r1[0]}k + ${v.t1 + v.t2}) : (${v.r1[1]}k + ${v.t1 + v.t2}) = ${v.r2[0]} : ${v.r2[1]}, which gives k = ${(v.a - v.t1) / v.r1[0]}. Ravi now = ${v.r1[0]}k + ${v.t1} = ${v.a}.`,
    });
  },
];

// ── Interest ────────────────────────────────────────────────────────────────
const interestHard: Gen[] = [
  (r) => {
    const v = attempt(() => {
      const rate = r.pick([5, 10, 20]);
      const P = r.int(2, 20) * 1000;
      const diff = (P * rate * rate * (300 + rate)) / 1e6;
      return Number.isInteger(diff) ? { rate, P, diff } : null;
    });
    return mcq(r, {
      prompt: `The difference between compound interest and simple interest on a sum for 3 years at ${v.rate}% per annum is ${rs(v.diff)}. What is the sum?`,
      correct: rs(v.P),
      distractors: [rs(Math.round((v.diff * 1e4) / (v.rate * v.rate))), rs(v.P * 2), rs(Math.round((v.diff * 1e4) / (3 * v.rate * v.rate))), rs(v.P + 1000)],
      explanation: `For 3 years, CI − SI = P × (r/100)² × (3 + r/100) = P × ${(v.rate / 100) ** 2} × ${3 + v.rate / 100}. So P = ${rs(v.P)}. Trap: using the 2-year formula P(r/100)².`,
    });
  },
  (r) => {
    const n = r.pick([4, 5, 8, 10, 12, 16, 20]);
    const k = r.int(3, 6);
    const ans = n * (k - 1);
    return mcq(r, {
      prompt: `A sum doubles itself in ${n} years at simple interest. In how many years will it become ${k} times itself?`,
      correct: `${ans} years`,
      distractors: [`${n * k} years`, `${n * (k - 1) + n} years`, `${n * 2 ** (k - 2)} years`, `${ans - n / 2} years`],
      explanation: `Doubling means the interest equals the principal in ${n} years. To be ${k} times, the interest must be ${k - 1} × principal: ${k - 1} × ${n} = ${ans} years. Trap: compound-style thinking (doubling again).`,
    });
  },
  (r) => {
    const v = attempt(() => {
      const rate = r.pick([8, 10, 12, 16, 20]);
      const P = r.int(2, 20) * 2500;
      const years = r.pick([1, 1.5, 2]);
      const half = rate / 2;
      const A = P * (1 + half / 100) ** (years * 2);
      const Ay = P * (1 + rate / 100) ** years;
      return Number.isInteger(Math.round(A * 100) / 100) && Math.abs(A - Math.round(A)) < 1e-6 && Math.abs(Ay - Math.round(Ay)) < 1e-6 ? { rate, P, years, A: Math.round(A), Ay: Math.round(Ay) } : null;
    });
    return mcq(r, {
      prompt: `What is the compound interest on ${rs(v.P)} for ${v.years} year${v.years === 1 ? "" : "s"} at ${v.rate}% per annum, compounded half-yearly?`,
      correct: rs(v.A - v.P),
      distractors: [rs(v.Ay - v.P), rs((v.P * v.rate * v.years) / 100), rs(v.A - v.P + 100), rs(Math.round(v.P * (1 + v.rate / 100) ** (v.years * 2) - v.P))],
      explanation: `Half-yearly: rate ${v.rate / 2}% per half-year for ${v.years * 2} half-years. Amount = ${inr(v.P)} × ${(1 + v.rate / 200).toFixed(2)}^${v.years * 2} = ${rs(v.A)}, so CI = ${rs(v.A - v.P)}. Trap: compounding yearly.`,
    });
  },
];

// ── Averages ────────────────────────────────────────────────────────────────
const averageHard: Gen[] = [
  (r) => {
    const v = attempt(() => {
      const n = r.int(20, 60);
      const avg = r.int(30, 70);
      const [wrong, right] = [r.int(10, 99), r.int(10, 99)];
      const corrected = (n * avg - wrong + right) / n;
      return wrong !== right && Number.isInteger(corrected * 100) && Math.abs(corrected - avg) > 0.05 ? { n, avg, wrong, right, corrected } : null;
    });
    return mcq(r, {
      prompt: `The average of ${v.n} observations was found to be ${v.avg}. Later it was discovered that one observation, ${v.right}, had been recorded as ${v.wrong}. What is the correct average?`,
      correct: fmt(v.corrected),
      distractors: [fmt((v.n * v.avg + v.wrong - v.right) / v.n), fmt((v.n * v.avg - v.wrong + v.right) / (v.n - 1)), fmt(v.corrected + 1), fmt(v.avg)],
      explanation: `Correct total = ${v.n} × ${v.avg} − ${v.wrong} + ${v.right} = ${v.n * v.avg - v.wrong + v.right}. Average = ÷ ${v.n} = ${fmt(v.corrected)}. Trap: correcting in the wrong direction.`,
    });
  },
  (r) => {
    const v = attempt(() => {
      const n = r.int(9, 15);
      const avg = r.int(40, 70);
      const [a1, a2] = [r.int(40, 70), r.int(40, 70)];
      const k = Math.floor(n / 2) + 1; // first k and last k share the middle one
      const middle = k * a1 + k * a2 - n * avg;
      return middle > 0 && middle < 150 && a1 !== a2 ? { n, avg, a1, a2, k, middle } : null;
    });
    return mcq(r, {
      prompt: `The average of ${v.n} numbers is ${v.avg}. The average of the first ${v.k} numbers is ${v.a1} and the average of the last ${v.k} numbers is ${v.a2}. What is the middle (${v.k}th) number?`,
      correct: String(v.middle),
      distractors: [String(Math.abs(v.k * v.a1 - v.k * v.a2)), String(v.middle + v.avg), String((v.a1 + v.a2) / 2 | 0), String(v.middle - 1)],
      explanation: `First ${v.k} + last ${v.k} = ${v.k * v.a1} + ${v.k * v.a2} counts all ${v.n} numbers once and the middle one twice. So middle = ${v.k * v.a1 + v.k * v.a2} − ${v.n * v.avg} = ${v.middle}.`,
    });
  },
];

// ── Mensuration ─────────────────────────────────────────────────────────────
const mensurationHard: Gen[] = [
  (r) => {
    const v = attempt(() => {
      const R = r.pick([6, 9, 12, 15, 18, 21, 24]);
      const rr = r.pick([1, 2, 3, 1.5]);
      const n = (R / rr) ** 3;
      return Number.isInteger(n) && n > 1 && n < 20000 ? { R, rr, n } : null;
    });
    return mcq(r, {
      prompt: `A solid metal sphere of radius ${v.R} cm is melted and recast into small spheres of radius ${v.rr} cm each. How many small spheres are made?`,
      correct: inr(v.n),
      distractors: [inr((v.R / v.rr) ** 2), inr(v.R / v.rr), inr(v.n / 2), inr(v.n * 2)],
      explanation: `Volume is conserved: (4/3)π${v.R}³ = n × (4/3)π${v.rr}³, so n = (${v.R}/${v.rr})³ = ${inr(v.n)}. Trap: squaring (that compares surface areas).`,
    });
  },
  (r) => {
    const [x, y] = [r.pick([10, 20, 25, 30, 40, 50]), r.pick([10, 20, 25, 30])];
    const change = x - y - (x * y) / 100;
    const say = (n: number) => `${fmt(Math.abs(n))}% ${n >= 0 ? "increase" : "decrease"}`;
    const z = r.pick([10, 20, 50]);
    const vol = (1 + x / 100) * (1 - y / 100) * (1 + z / 100) * 100 - 100;
    return mcq(r, {
      prompt: `The length of a cuboid is increased by ${x}%, its breadth decreased by ${y}% and its height increased by ${z}%. What is the percentage change in its volume?`,
      correct: say(vol),
      distractors: [say(x - y + z), say(change), say(vol + 5), say(-vol)],
      explanation: `Multiply the factors: ${1 + x / 100} × ${1 - y / 100} × ${1 + z / 100} = ${fmt(1 + vol / 100, 4)}, i.e. ${say(vol)}. Trap: adding the percentages (${say(x - y + z)}).`,
    });
  },
  (r) => {
    const v = attempt(() => {
      const [l, b, h] = [r.int(8, 20), r.int(6, 15), r.int(3, 5)];
      const [dw, dh] = [r.int(1, 2), r.int(2, 3)];
      const windows = r.int(1, 3);
      const area = 2 * h * (l + b) - dw * dh - windows * 2;
      const rate = r.pick([20, 25, 40, 50]);
      return { l, b, h, dw, dh, windows, area, rate, cost: area * rate };
    });
    return mcq(r, {
      prompt: `A room is ${v.l} m long, ${v.b} m wide and ${v.h} m high. It has one door of ${v.dw} m × ${v.dh} m and ${v.windows} window${v.windows > 1 ? "s" : ""} of 1 m × 2 m each. What is the cost of painting the four walls at ₹${v.rate} per m²?`,
      correct: rs(v.cost),
      distractors: [rs((v.area + v.dw * v.dh + v.windows * 2) * v.rate), rs((v.area + v.l * v.b) * v.rate), rs((v.h * (v.l + v.b) - v.dw * v.dh - v.windows * 2) * v.rate), rs(v.cost + v.rate * 2)],
      explanation: `Four walls = 2h(l + b) = 2 × ${v.h} × ${v.l + v.b} = ${2 * v.h * (v.l + v.b)} m². Remove the door (${v.dw * v.dh}) and windows (${v.windows * 2}): ${v.area} m² × ₹${v.rate} = ${rs(v.cost)}. Traps: forgetting the openings, or using h(l + b).`,
    });
  },
];

// ── Algebra ─────────────────────────────────────────────────────────────────
const algebraHard: Gen[] = [
  (r) => {
    const [p, q] = attempt(() => {
      const [a, b] = [r.int(-6, 9), r.int(-6, 9)];
      return a !== 0 && b !== 0 && a !== b ? [a, b] : null;
    });
    const [s, prod] = [p + q, p * q];
    const ask = r.pick(["sq", "cube", "recip"] as const);
    const ans = ask === "sq" ? s * s - 2 * prod : ask === "cube" ? s ** 3 - 3 * prod * s : null;
    const coef = (k: number) => (Math.abs(k) === 1 ? "" : String(Math.abs(k)));
    const eq = `x² ${s >= 0 ? "−" : "+"} ${coef(s)}x ${prod >= 0 ? "+" : "−"} ${Math.abs(prod)} = 0`;
    if (s === 0) return algebraHard[1](r);
    if (ask === "recip") {
      return mcq(r, {
        prompt: `If α and β are the roots of ${eq}, what is 1/α + 1/β?`,
        correct: fraction(s, prod).replace(/^-/, "−"),
        distractors: [fraction(prod, s || 1), fraction(-s, prod), fraction(s * s - 2 * prod, prod), fraction(s, prod * prod)].map((x) => x.replace(/^-/, "−")),
        explanation: `α + β = ${num(s)}, αβ = ${num(prod)}. 1/α + 1/β = (α + β)/αβ = ${num(s)}/${num(prod)} = ${fraction(s, prod).replace(/^-/, "−")}.`,
      });
    }
    return mcq(r, {
      prompt: `If α and β are the roots of ${eq}, what is ${ask === "sq" ? "α² + β²" : "α³ + β³"}?`,
      correct: num(ans!),
      distractors: (ask === "sq" ? [s * s, s * s + 2 * prod, s * s - prod] : [s ** 3, s ** 3 - 3 * prod, s ** 3 + 3 * prod * s]).map(num),
      explanation: `α + β = ${num(s)}, αβ = ${num(prod)}. ${ask === "sq" ? `α² + β² = (α + β)² − 2αβ = ${num(s * s)} − (${num(2 * prod)})` : `α³ + β³ = (α + β)³ − 3αβ(α + β) = ${num(s ** 3)} − (${num(3 * prod * s)})`} = ${num(ans!)}.`,
    });
  },
  (r) => {
    const v = attempt(() => {
      const [p1, p2] = [r.pick([5, 10, 20, 50]), r.pick([2, 5, 10, 20])];
      const [n1, n2] = [r.int(3, 30), r.int(3, 30)];
      return p1 !== p2 ? { p1, p2, n1, n2, total: n1 + n2, value: p1 * n1 + p2 * n2 } : null;
    });
    return mcq(r, {
      prompt: `A bag has ${v.total} notes, all of ₹${v.p1} and ₹${v.p2}. Their total value is ${rs(v.value)}. How many ₹${v.p1} notes are there?`,
      correct: String(v.n1),
      distractors: [String(v.n2), String(v.n1 + 1), String(Math.round(v.value / (v.p1 + v.p2))), String(v.total - v.n1 + 2)],
      explanation: `If all ${v.total} were ₹${v.p2}: ${rs(v.total * v.p2)}. Each ₹${v.p1} note adds ₹${v.p1 - v.p2} more, and we need ${rs(v.value - v.total * v.p2)} more: ${v.value - v.total * v.p2}/${v.p1 - v.p2} = ${v.n1}.`,
    });
  },
];

// ── Progressions ────────────────────────────────────────────────────────────
const progressionHard: Gen[] = [
  (r) => {
    const [a, q, n] = [r.int(1, 5), r.int(2, 3), r.int(5, 8)];
    const sum = (a * (q ** n - 1)) / (q - 1);
    return mcq(r, {
      prompt: `What is the sum of the first ${n} terms of the series ${a}, ${a * q}, ${a * q * q}, …?`,
      correct: inr(sum),
      distractors: [inr(a * q ** n), inr((a * (q ** (n + 1) - 1)) / (q - 1)), inr((a * (q ** (n - 1) - 1)) / (q - 1)), inr(a * q ** (n - 1))],
      explanation: `Geometric series with a = ${a}, r = ${q}: Sₙ = a(rⁿ − 1)/(r − 1) = ${a}(${q}^${n} − 1)/${q - 1} = ${inr(sum)}.`,
    });
  },
  (r) => {
    const [lo, hi, k] = [r.int(10, 99), r.int(300, 999), r.int(6, 13)];
    const terms = range(lo, hi).filter((x) => x % k === 0);
    const sum = terms.reduce((s, x) => s + x, 0);
    return mcq(r, {
      prompt: `What is the sum of all numbers between ${lo} and ${hi} (inclusive) that are divisible by ${k}?`,
      correct: inr(sum),
      distractors: [inr(sum + terms[0]), inr(sum - terms.at(-1)!), inr(((terms.length + 1) * (terms[0] + terms.at(-1)!)) / 2), inr(Math.round(((hi - lo) / k) * (lo + hi) / 2))],
      explanation: `First such number ${terms[0]}, last ${terms.at(-1)}, count = (${terms.at(-1)} − ${terms[0]})/${k} + 1 = ${terms.length}. Sum = ${terms.length} × (${terms[0]} + ${terms.at(-1)})/2 = ${inr(sum)}. Trap: counting terms as (last − first)/${k} without the +1.`,
    });
  },
];

// ── Boats & streams ─────────────────────────────────────────────────────────
const boatsHard: Gen[] = [
  (r) => {
    const v = attempt(() => {
      const [b, s] = [r.int(6, 15), r.int(1, 5)];
      if (s >= b) return null;
      const [u, d] = [b - s, b + s];
      const [x1, y1, x2, y2] = [u * r.int(1, 3), d * r.int(1, 3), u * r.int(1, 3), d * r.int(1, 3)];
      const [t1, t2] = [x1 / u + y1 / d, x2 / u + y2 / d];
      if (x1 * y2 === x2 * y1) return null; // the two trips must give independent equations
      return { b, s, x1, y1, x2, y2, t1, t2 };
    });
    return mcq(r, {
      prompt: `A boat goes ${v.x1} km upstream and ${v.y1} km downstream in ${v.t1} hours. It goes ${v.x2} km upstream and ${v.y2} km downstream in ${v.t2} hours. What is the speed of the stream?`,
      correct: `${v.s} km/h`,
      distractors: [`${v.b} km/h`, `${v.b - v.s} km/h`, `${v.s + 1} km/h`, `${(v.b + v.s) / 2} km/h`],
      explanation: `Let upstream speed = u, downstream = d. ${v.x1}/u + ${v.y1}/d = ${v.t1} and ${v.x2}/u + ${v.y2}/d = ${v.t2}. Solving (treat 1/u and 1/d as unknowns): u = ${v.b - v.s}, d = ${v.b + v.s}. Stream = (d − u)/2 = ${v.s} km/h.`,
    });
  },
];

// ── Data interpretation (multi-step) ────────────────────────────────────────
const diHard: Gen[] = [
  (r) => {
    const years = ["2021", "2022", "2023", "2024"];
    const items = r.shuffle(["Laptops", "Phones", "Tablets", "Monitors", "Printers"]).slice(0, 4);
    const data = items.map(() => years.map(() => r.int(8, 60) * 5));
    const table = [["Units sold (thousands)", ...years], ...items.map((it, i) => [it, ...data[i].map(String)])];
    const kind = r.int(0, 2);
    if (kind === 0) {
      const growth = data.map((row) => (row[3] - row[0]) / row[0]);
      const best = growth.indexOf(Math.max(...growth));
      const absBest = data.map((row) => row[3] - row[0]).reduce((bi, x, i, a) => (x > a[bi] ? i : bi), 0);
      if (best === absBest) return diHard[0](r);
      return mcq(r, {
        prompt: `Based on the table, which product had the highest percentage growth from 2021 to 2024?`,
        table,
        correct: items[best],
        distractors: items.filter((_, i) => i !== best),
        explanation: `Growth % = (2024 − 2021)/2021: ${items.map((it, i) => `${it} ${fmt(growth[i] * 100)}%`).join(", ")}. ${items[best]} is highest. Trap: ${items[absBest]} has the biggest increase in units, not in percentage.`,
      });
    }
    if (kind === 1) {
      const [a, b] = r.shuffle([0, 1, 2, 3]).slice(0, 2);
      const t1 = data[a][1] + data[b][1];
      const t2 = data[a][3] + data[b][3];
      const ch = ((t2 - t1) / t1) * 100;
      return mcq(r, {
        prompt: `Based on the table, by what percentage did the combined sales of ${items[a]} and ${items[b]} change from 2022 to 2024? (to 2 decimal places)`,
        table,
        correct: `${num(ch)}%`,
        distractors: [`${num(((t2 - t1) / t2) * 100)}%`, `${num(((data[a][3] - data[a][1]) / data[a][1] + (data[b][3] - data[b][1]) / data[b][1]) * 50)}%`, `${num(ch + 3)}%`, `${num(-ch)}%`],
        explanation: `2022: ${data[a][1]} + ${data[b][1]} = ${t1}; 2024: ${data[a][3]} + ${data[b][3]} = ${t2}. Change = (${t2} − ${t1})/${t1} × 100 = ${num(ch)}% (negative means a fall). Trap: averaging the two products' separate growth rates.`,
      });
    }
    const totals = years.map((_, j) => data.reduce((s, row) => s + row[j], 0));
    const j = r.int(0, 3);
    const i = r.int(0, 3);
    const share = (data[i][j] / totals[j]) * 100;
    return mcq(r, {
      prompt: `Based on the table, what percentage of all units sold in ${years[j]} were ${items[i]}? (to 2 decimal places)`,
      table,
      correct: `${fmt(share)}%`,
      distractors: [`${fmt((data[i][j] / data[i].reduce((s, x) => s + x, 0)) * 100)}%`, `${fmt(share + 2)}%`, `${fmt(100 / 4)}%`, `${fmt((data[i][j] / totals[(j + 1) % 4]) * 100)}%`],
      explanation: `Total in ${years[j]} = ${data.map((row) => row[j]).join(" + ")} = ${totals[j]}. ${items[i]} share = ${data[i][j]}/${totals[j]} × 100 = ${fmt(share)}%. Trap: dividing by ${items[i]}'s total over all years.`,
    });
  },
];

// ── Pseudocode ──────────────────────────────────────────────────────────────
type Built = { code: string; ans: number; alts: number[]; why: string };
const pseudo = (b: (r: Rng) => Built): Gen => (r) => {
  const x = b(r);
  return mcq(r, { prompt: "What will be the output of the following pseudocode?", code: x.code, correct: String(x.ans), distractors: x.alts.map(String), explanation: x.why });
};
const digitsHard: Gen[] = [
  pseudo((r) => {
    const [lo, hi, k] = [r.int(10, 60), r.int(80, 200), r.int(3, 7)];
    const ds = (n: number) => String(n).split("").reduce((a, d) => a + Number(d), 0);
    const ans = range(lo, hi).filter((n) => ds(n) % k === 0).length;
    return {
      code: `Integer i, n, s, c
Set c = 0
for (i = ${lo} to ${hi})
    Set n = i, s = 0
    while (n > 0)
        s = s + n mod 10
        n = n / 10
    end while
    if (s mod ${k} == 0)
        c = c + 1
    end if
end for
Print c`,
      ans,
      alts: [range(lo, hi - 1).filter((n) => ds(n) % k === 0).length, range(lo, hi).filter((n) => n % k === 0).length, ans + 1, range(lo + 1, hi).filter((n) => ds(n) % k === 0).length],
      why: `For each i the inner loop adds up its digits. c counts the i from ${lo} to ${hi} whose digit sum is divisible by ${k}: ${ans}. Trap: counting i divisible by ${k} instead of its digit sum.`,
    };
  }),
  pseudo((r) => {
    const n0 = r.int(1000, 99999);
    let n = n0;
    let rounds = 0;
    while (n > 9) {
      n = String(n).split("").reduce((a, d) => a + Number(d), 0);
      rounds++;
    }
    return {
      code: `Integer n, s, c
Set n = ${n0}, c = 0
while (n > 9)
    Set s = 0
    while (n > 0)
        s = s + n mod 10
        n = n / 10
    end while
    n = s
    c = c + 1
end while
Print n * 10 + c`,
      ans: n * 10 + rounds,
      alts: [n * 10 + rounds + 1, String(n0).split("").reduce((a, d) => a + Number(d), 0) * 10 + 1, n, (n * 10 + rounds) % 100 === n * 10 + rounds ? n * 10 : n * 10 + rounds - 1],
      why: `The outer loop replaces n by its digit sum until one digit is left (the digital root ${n}), counting ${rounds} round(s). Output ${n} × 10 + ${rounds} = ${n * 10 + rounds}.`,
    };
  }),
];
const arraysHard: Gen[] = [
  pseudo((r) => {
    const arr = Array.from({ length: 6 }, () => r.int(1, 9));
    const run = (inPlace: boolean) => {
      const a = [...arr];
      const src = inPlace ? a : [...arr];
      for (let i = 1; i < 6; i++) a[i] = a[i] + src[i - 1];
      return a;
    };
    const a = run(true);
    const k = r.int(0, 5);
    return {
      code: `Integer arr[6] = {${arr.join(", ")}}
Integer i
for (i = 1 to 5)
    arr[i] = arr[i] + arr[i - 1]
end for
Print arr[${k}] + arr[5]`,
      ans: a[k] + a[5],
      alts: [run(false)[k] + run(false)[5], a[k] + a[4], arr[k] + a[5], a[5]],
      why: `Updating in place makes each arr[i] the running total (prefix sum): ${a.join(", ")}. arr[${k}] + arr[5] = ${a[k]} + ${a[5]} = ${a[k] + a[5]}. Trap: using the original arr[i − 1] instead of the updated one.`,
    };
  }),
  pseudo((r) => {
    const arr = r.shuffle(range(1, 9)).slice(0, 6);
    const passes = r.int(1, 3);
    const a = [...arr];
    let swaps = 0;
    for (let p = 0; p < passes; p++) for (let j = 0; j < 5 - p; j++) if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; swaps++; }
    const k = r.int(0, 5);
    return {
      code: `Integer arr[6] = {${arr.join(", ")}}
Integer p, j, t, c
Set c = 0
for (p = 0 to ${passes - 1})
    for (j = 0 to 4 - p)
        if (arr[j] > arr[j + 1])
            t = arr[j]
            arr[j] = arr[j + 1]
            arr[j + 1] = t
            c = c + 1
        end if
    end for
end for
Print arr[${k}] * 10 + c`,
      ans: a[k] * 10 + swaps,
      alts: [[...arr].sort((x, y) => x - y)[k] * 10 + swaps, arr[k] * 10 + swaps, a[k] * 10 + swaps + 1, a[(k + 1) % 6] * 10 + swaps],
      why: `${passes} pass(es) of bubble sort: ${a.join(", ")} after ${swaps} swap(s). arr[${k}] × 10 + c = ${a[k] * 10 + swaps}. Trap: assuming the array is fully sorted after ${passes} pass(es).`,
    };
  }),
];
const functionsHard: Gen[] = [
  pseudo((r) => {
    const [n, k] = [r.int(4, 8), r.int(2, 3)];
    const f = (x: number): number => (x <= 0 ? 1 : g(x - 1) + x);
    const g = (x: number): number => (x <= 0 ? 0 : f(x - 1) * k);
    return {
      code: `Integer f(Integer x)
    if (x <= 0)
        return 1
    end if
    return g(x - 1) + x
End function f()

Integer g(Integer x)
    if (x <= 0)
        return 0
    end if
    return f(x - 1) * ${k}
End function g()

Print f(${n})`,
      ans: f(n),
      alts: [f(n - 1), g(n), f(n) + k, f(n + 1)],
      why: `f and g call each other, each time with x − 1. Unwinding from the base cases: f(${n}) = ${f(n)}.`,
    };
  }),
];

// ── Puzzles ─────────────────────────────────────────────────────────────────
/** 3×3 grid of 1–9 (each once) with row and column sums; some cells shown; find one hidden cell. */
const gridSums: Gen = (r) => {
  for (;;) {
    const cells = r.shuffle(range(1, 9));
    const rows = [0, 1, 2].map((i) => cells[i * 3] + cells[i * 3 + 1] + cells[i * 3 + 2]);
    const cols = [0, 1, 2].map((j) => cells[j] + cells[j + 3] + cells[j + 6]);
    const order = r.shuffle(range(0, 8));
    for (let shown = 2; shown <= 5; shown++) {
      const known = new Set(order.slice(0, shown));
      const free = range(0, 8).filter((i) => !known.has(i));
      const left = range(1, 9).filter((v) => !order.slice(0, shown).some((i) => cells[i] === v));
      const perms = (xs: number[]): number[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
      const sols = perms(left).filter((p) => {
        const g = [...cells];
        free.forEach((idx, k) => (g[idx] = p[k]));
        return [0, 1, 2].every((i) => g[i * 3] + g[i * 3 + 1] + g[i * 3 + 2] === rows[i] && g[i] + g[i + 3] + g[i + 6] === cols[i]);
      });
      if (sols.length !== 1) continue;
      const target = r.pick(free);
      const grid: (number | string | null)[][] = [0, 1, 2].map((i) => [...[0, 1, 2].map((j) => (known.has(i * 3 + j) ? cells[i * 3 + j] : i * 3 + j === target ? "?" : "·")), rows[i]]);
      grid.push([...cols, ""]);
      return mcq(r, {
        prompt: "Fill the 3×3 grid with the numbers 1 to 9, each used once. The number at the end of each row and below each column is that row's or column's sum. What number goes in the cell marked '?'",
        grid,
        correct: String(cells[target]),
        distractors: r.shuffle(left.filter((v) => v !== cells[target])).map(String),
        explanation: `Only one way to fill the grid fits all six sums: ${[0, 1, 2].map((i) => cells.slice(i * 3, i * 3 + 3).join(" ")).join(" / ")}. So ? = ${cells[target]}. Start with the row or column that has the most cells already filled.`,
      });
    }
  }
};
/** Three numbers per row, two-step rule. */
const rowRule3: Gen = (r) => {
  const rules: [string, (a: number, b: number, c: number) => number][] = [
    ["first × second − third", (a, b, c) => a * b - c],
    ["(first + second) × third", (a, b, c) => (a + b) * c],
    ["first² + second − third", (a, b, c) => a * a + b - c],
    ["first × second + second × third", (a, b, c) => a * b + b * c],
    ["(first − third) × second", (a, b, c) => (a - c) * b],
    ["first + second² − third", (a, b, c) => a + b * b - c],
  ];
  for (;;) {
    const [text, f] = r.pick(rules);
    const rows = Array.from({ length: 3 }, () => [r.int(2, 9), r.int(2, 9), r.int(1, 8)]);
    if (rows.some(([a, b, c]) => f(a, b, c) <= 0)) continue;
    // No other rule in the list may fit the first two rows but give a different answer on the third.
    const others = rules.filter(([t]) => t !== text);
    if (others.some(([, g]) => rows.slice(0, 2).every(([a, b, c]) => g(a, b, c) === f(a, b, c)))) continue;
    const [a, b, c] = rows[2];
    const ans = f(a, b, c);
    return mcq(r, {
      prompt: "Each row follows the same rule to get the last number from the first three. Find the missing number.",
      grid: rows.map((row, i) => [...row, i === 2 ? null : f(row[0], row[1], row[2])]),
      correct: String(ans),
      distractors: others.map(([, g]) => g(a, b, c)).filter((x) => x !== ans && x > 0).map(String),
      explanation: `Rule: last = ${text}. Check row 1: ${rows[0].join(", ")} → ${f(rows[0][0], rows[0][1], rows[0][2])}. Row 3: ${a}, ${b}, ${c} → ${ans}. Test a rule on at least two complete rows before trusting it.`,
    });
  }
};
/** General 3×3 magic square (not just Lo Shu): only 3 cells shown. */
const magicHard: Gen = (r) => {
  const sq = (c: number, a: number, b: number) => [
    [c - b, c + a + b, c - a],
    [c - a + b, c, c + a - b],
    [c + a, c - a - b, c + b],
  ];
  for (;;) {
    const [c, a, b] = [r.int(10, 30), r.int(1, 8), r.int(1, 8)];
    const s = sq(c, a, b).flat();
    if (new Set(s).size !== 9 || s.some((x) => x <= 0) || a === b) continue;
    const shown = r.shuffle(range(0, 8)).slice(0, 3);
    if (shown.includes(4)) continue; // without the centre it takes more work
    const cell = (i: number, cc: number, aa: number, bb: number) => [cc - bb, cc + aa + bb, cc - aa, cc - aa + bb, cc, cc + aa - bb, cc + aa, cc - aa - bb, cc + bb][i];
    const fits: number[][] = [];
    for (let cc = 1; cc <= 40; cc++) for (let aa = -12; aa <= 12; aa++) for (let bb = -12; bb <= 12; bb++) {
      if (!shown.every((i) => cell(i, cc, aa, bb) === s[i])) continue;
      const t = sq(cc, aa, bb).flat();
      if (new Set(t).size === 9 && t.every((x) => x > 0)) fits.push(t);
    }
    const target = r.pick(range(0, 8).filter((i) => !shown.includes(i)));
    if (new Set(fits.map((t) => t[target])).size !== 1) continue;
    const grid = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (shown.includes(i * 3 + j) ? s[i * 3 + j] : i * 3 + j === target ? "?" : "·")));
    return mcq(r, {
      prompt: "This is a magic square: every row, column and both diagonals add up to the same number (the numbers are all different). Find the number marked '?'.",
      grid,
      correct: String(s[target]),
      distractors: [s[target] + 1, s[target] - 2, 3 * c, s[target] + a].filter((x) => x !== s[target] && x > 0).map(String),
      explanation: `In any 3×3 magic square the centre is one third of the magic sum, and opposite cells around the centre add up to twice the centre. From the given cells the centre is ${c}, the magic sum ${3 * c}, and the square is ${[0, 1, 2].map((i) => s.slice(i * 3, i * 3 + 3).join(" ")).join(" / ")}. So ? = ${s[target]}.`,
    });
  }
};
/** 5-level pyramid with two unknowns in the bottom row and one clue in the middle. */
const pyramidHard: Gen = (r) => {
  for (;;) {
    const base = Array.from({ length: 5 }, () => r.int(1, 9));
    const levels = [base];
    while (levels[0].length > 1) {
      const below = levels[0];
      levels.unshift(below.slice(1).map((v, i) => below[i] + v));
    }
    const [h1, h2] = r.shuffle(range(0, 4)).slice(0, 2).sort();
    const clueRow = 2 + r.int(0, 1); // a row with 3 or 4 cells
    const clueIdx = r.int(0, levels[clueRow].length - 1);
    const sols: number[][] = [];
    for (let x = 1; x <= 30; x++) for (let y = 1; y <= 30; y++) {
      const b = [...base];
      b[h1] = x;
      b[h2] = y;
      const L = [b];
      while (L[0].length > 1) L.unshift(L[0].slice(1).map((v, i) => L[0][i] + v));
      if (L[0][0] === levels[0][0] && L[clueRow][clueIdx] === levels[clueRow][clueIdx]) sols.push([x, y]);
    }
    if (sols.length !== 1) continue;
    const askFirst = r.next() < 0.5;
    const ans = askFirst ? base[h1] : base[h2];
    const shown = levels.map((row, i) => row.map((v, j) => (i === 0 || (i === clueRow && j === clueIdx) ? v : i === 4 ? (j === h1 ? "A" : j === h2 ? "B" : v) : "·")));
    return mcq(r, {
      prompt: `In this number pyramid each number is the sum of the two directly below it. Find ${askFirst ? "A" : "B"}.`,
      grid: shown,
      correct: String(ans),
      distractors: [base[askFirst ? h2 : h1], ans + 1, ans + 2, Math.max(1, ans - 1)].filter((x) => x !== ans).map(String),
      explanation: `The top of a 5-row pyramid is b1 + 4b2 + 6b3 + 4b4 + b5, which gives one equation in A and B; the middle clue gives a second. Solving both: A = ${base[h1]}, B = ${base[h2]}.`,
    });
  }
};
/** Four symbols, four equations, solved by brute force over 1–12. */
const symbolsHard: Gen = (r) => {
  const S = ["★", "◆", "●", "▲"];
  for (;;) {
    const v = Array.from({ length: 4 }, () => r.int(1, 12));
    const [a, b, c, d] = v;
    const eqs: [string, (x: number[]) => number][] = [
      [`${S[0]} + ${S[1]} + ${S[2]}`, (x) => x[0] + x[1] + x[2]],
      [`${S[0]} × ${S[1]}`, (x) => x[0] * x[1]],
      [`${S[1]} − ${S[2]} + ${S[3]}`, (x) => x[1] - x[2] + x[3]],
      [`${S[2]} × ${S[3]} − ${S[0]}`, (x) => x[2] * x[3] - x[0]],
    ];
    const rhs = eqs.map(([, f]) => f(v));
    let count = 0;
    for (let p = 1; p <= 12 && count < 2; p++) for (let q = 1; q <= 12; q++) for (let s = 1; s <= 12; s++) for (let t = 1; t <= 12; t++) {
      const x = [p, q, s, t];
      if (eqs.every(([, f], i) => f(x) === rhs[i])) count++;
    }
    if (count !== 1) continue;
    const ans = a * d + b - c;
    if (ans <= 0 || a * (d + b) - c <= 0) continue;
    return mcq(r, {
      prompt: `Each symbol stands for a whole number from 1 to 12.\n${eqs.map(([t], i) => `${t} = ${num(rhs[i])}`).join("\n")}\nWhat is ${S[0]} × ${S[3]} + ${S[1]} − ${S[2]}?`,
      correct: String(ans),
      distractors: [a * (d + b) - c, a * d + b + c, ans + 1, a + d + b - c].filter((x) => x !== ans).map(String),
      explanation: `The values that satisfy all four equations are ${S[0]} = ${a}, ${S[1]} = ${b}, ${S[2]} = ${c}, ${S[3]} = ${d} (try factor pairs of the product first). Then ${a} × ${d} + ${b} − ${c} = ${ans}.`,
    });
  }
};

/** 4-digit + 4-digit cryptarithm with at most two hints. */
const CL = "ABCDEFGHKMNPRTUWXY".split("");
const cryptHard: Gen = (r) => {
  for (;;) {
    const a = r.int(1000, 9999);
    const b = r.int(1000, 9999);
    const sum = a + b;
    const digits = [...new Set(`${a}${b}${sum}`)];
    if (digits.length < 7) continue; // too many repeated letters makes it easy
    const letters = r.shuffle(CL).slice(0, digits.length);
    const letterOf = Object.fromEntries(digits.map((d, i) => [d, letters[i]]));
    const word = (n: number) => [...`${n}`].map((d) => letterOf[d]).join("");
    const words: [string, string, string] = [word(a), word(b), word(sum)];
    const truth: Record<string, number> = Object.fromEntries(digits.map((d) => [letterOf[d], Number(d)]));
    // Not the leading carry letter of the sum: that one is always 1.
    const target = r.pick(letters.filter((l) => !(words[2].length > 4 && l === words[2][0])));
    const given: Record<string, number> = {};
    const hidden = r.shuffle(letters.filter((l) => l !== target));
    let ok = false;
    for (;;) {
      const sols = solveAddition(words, given);
      if (new Set(sols.map((x) => x[target])).size === 1) {
        ok = true;
        break;
      }
      if (Object.keys(given).length === 2 || !hidden.length) break;
      const l = hidden.pop()!;
      given[l] = truth[l];
    }
    if (!ok) continue;
    const w = words[2].length + 2;
    const code = [`  ${words[0]}`.padStart(w), `+ ${words[1]}`.padStart(w), "-".repeat(w), words[2].padStart(w)].join("\n");
    const hints = Object.entries(given).map(([l, d]) => `${l} = ${d}`);
    const ans = truth[target];
    const taken = new Set([ans, ...Object.values(given)]);
    return mcq(r, {
      prompt: `Each letter stands for a different digit (0–9), and no number starts with 0.${hints.length ? ` Given: ${hints.join(", ")}.` : ""}\nWhat is the value of ${target}?`,
      code,
      correct: String(ans),
      distractors: r.shuffle(range(0, 9).filter((d) => !taken.has(d))).map(String),
      explanation: `Four columns and only ${hints.length} hint${hints.length === 1 ? "" : "s"}: work from the right, track carries, and use "no leading zero"${words[2].length > 4 ? ` (the 5th letter ${words[2][0]} is a carry, so it is 1)` : ""}. The digits must make ${a} + ${b} = ${sum}, and every assignment that fits gives ${target} = ${ans}.`,
    });
  }
};

export const HARD_MORE: Record<string, (seed: number) => Question> = {
  "m-profit": pick(profitHard, 0x11),
  "m-ratio": pick(ratioHard, 0x22),
  "m-interest": pick(interestHard, 0x33),
  "m-average": pick(averageHard, 0x44),
  "m-mensuration": pick(mensurationHard, 0x55),
  "m-algebra": pick(algebraHard, 0x66),
  "m-progression": pick(progressionHard, 0x77),
  "m-boats": pick(boatsHard, 0x88),
  "m-di": pick(diHard, 0x99),
  "p-digits": pick(digitsHard, 0xaa),
  "p-arrays": pick(arraysHard, 0xbb),
  "p-functions": pick(functionsHard, 0xcc),
  "z-rowrule": pick([rowRule3, gridSums], 0xdd),
  "z-magic": pick([magicHard], 0xee),
  "z-pyramid": pick([pyramidHard], 0xff),
  "z-symbols": pick([symbolsHard], 0x101),
  "z-crypt": pick([cryptHard], 0x102),
};
