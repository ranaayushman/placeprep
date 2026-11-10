/**
 * More question types for the math topics, written to cover the recurring Infosys-style quant
 * patterns (successive changes, pipes, replacement mixtures, remainder cycles, circular seating,
 * algebra identities, progressions…). Every question is generated: numbers are picked so the answer
 * is clean, and the answer is computed, never typed in.
 */
import { dpNote, fmt, fraction, gcd, mcq, rng, type Rng } from "./rng";
import type { Question } from "./types";

type Gen = (r: Rng) => Question;
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const pc = (x: number) => `${fmt(x)}%`;
/** A typographic minus for negative numbers in question text. */
const signed = (n: number) => (n < 0 ? `−${-n}` : String(n));
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const P = (n: number, k: number) => fact(n) / fact(n - k);
const C = (n: number, k: number) => (k < 0 || k > n ? 0 : P(n, k) / fact(k));

/**
 * A topic's generator: about 40% of seeds keep the original question types, the rest draw one of
 * the extra types. Deterministic per seed, like every generator.
 */
export function withExtras(base: (seed: number) => Question, extras: Gen[]): (seed: number) => Question {
  return (seed) => {
    const r = rng(seed * 7919 + 17);
    return r.next() < 0.4 ? base(seed) : extras[r.int(0, extras.length - 1)](r);
  };
}

/** A topic made only of these generators (algebra, progressions). */
export const fromGens = (gens: Gen[]) => (seed: number) => {
  const r = rng(seed);
  return gens[r.int(0, gens.length - 1)](r);
};

// ── Percentages ──────────────────────────────────────────────────────────────
export const percentExtras: Gen[] = [
  (r) => {
    const [s, k] = r.pick([[72, 25], [80, 25], [60, 20], [72, 20], [75, 50], [84, 20], [90, 50], [64, 60]] as const);
    const ans = s / (1 + k / 100);
    return mcq(r, {
      prompt: `A candidate scores ${s}% in a test. If the maximum marks are increased by ${k}% and the candidate's marks stay the same, what is the new percentage?${dpNote(2, ans)}`,
      correct: pc(ans),
      distractors: [pc(s - k), pc(s * (1 - k / 100)), pc(ans + 4), pc(s)],
      explanation: `The marks are fixed and the maximum is ×${1 + k / 100}, so the percentage becomes ${s} ÷ ${1 + k / 100} = ${fmt(ans)}%.`,
    });
  },
  (r) => {
    const x = r.pick([10, 20, 25, 40, 50, 60, 100]);
    const ans = (x / (100 + x)) * 100;
    return mcq(r, {
      prompt: `The price of an item is increased by ${x}%. By what percentage must the new price be reduced to bring it back to the original price?${dpNote(2, ans)}`,
      correct: pc(ans),
      distractors: [pc(x), pc(x / 2), pc(ans + 5), pc(Math.max(ans - 5, 1))],
      explanation: `Take the price as 100: it becomes ${100 + x}. The cut needed is ${x} out of ${100 + x} = ${fmt(ans)}%. The base is the new price.`,
    });
  },
  (r) => {
    const w = r.int(4, 12) * 5;
    const [a, b] = [r.int(2, 8) * 5, r.int(2, 8) * 5];
    const ans = (w * a + (100 - w) * b) / 100;
    return mcq(r, {
      prompt: `${w}% of the students in a batch are women. ${a}% of the women and ${b}% of the men are selected. What percentage of the whole batch is selected?${dpNote(2, ans)}`,
      correct: pc(ans),
      distractors: [pc((a + b) / 2), pc((w * a) / 100), pc(ans + 2.5), pc(a === b ? ans + 5 : Math.max(a, b))],
      explanation: `Weight each group by its size: ${w}% × ${a}% + ${100 - w}% × ${b}% = ${fmt((w * a) / 100)}% + ${fmt(((100 - w) * b) / 100)}% = ${fmt(ans)}%.`,
    });
  },
  (r) => {
    const v = r.int(4, 15) * 10000;
    const d = r.pick([10, 20, 25]);
    const ans = v * (1 - d / 100) ** 2;
    return mcq(r, {
      prompt: `A machine worth ${rupees(v)} loses ${d}% of its value every year. What is it worth after 2 years?`,
      correct: rupees(Math.round(ans)),
      distractors: [rupees(v * (1 - (2 * d) / 100)), rupees(v * (1 - d / 100)), rupees(Math.round(ans) + 1000), rupees(Math.round(ans * (1 - d / 100)))],
      explanation: `Each year it keeps ${100 - d}%: ${rupees(v)} × ${fmt(1 - d / 100)}² = ${rupees(Math.round(ans))}. Successive cuts multiply; they don't add to ${2 * d}%.`,
    });
  },
];

// ── Profit, loss & discount ─────────────────────────────────────────────────
const gainOrLoss = (x: number) => (x >= 0 ? `${fmt(x)}% profit` : `${fmt(-x)}% loss`);
export const profitExtras: Gen[] = [
  (r) => {
    const m = r.pick([40, 50, 60, 80]);
    const [d1, d2] = [r.pick([10, 20]), r.pick([10, 20, 25])];
    const ans = ((1 + m / 100) * (1 - d1 / 100) * (1 - d2 / 100) - 1) * 100;
    return mcq(r, {
      prompt: `An article is marked ${m}% above its cost price. Two successive discounts of ${d1}% and ${d2}% are given. What is the profit or loss percentage?`,
      correct: gainOrLoss(ans),
      distractors: [gainOrLoss(m - d1 - d2), gainOrLoss(((1 + m / 100) * (1 - (d1 + d2) / 100) - 1) * 100), gainOrLoss(ans + 4), gainOrLoss(-ans || 5)],
      explanation: `Take CP = 100. Marked = ${100 + m}. After ${d1}%: ${fmt((100 + m) * (1 - d1 / 100))}. After ${d2}%: ${fmt((100 + m) * (1 - d1 / 100) * (1 - d2 / 100))}. So ${gainOrLoss(ans)}. Successive discounts multiply.`,
    });
  },
  (r) => {
    const cp = r.int(8, 30) * 100;
    const [p, q] = r.shuffle([10, 15, 20, 25, 30]).slice(0, 2);
    const sp = cp * (1 + p / 100);
    const ans = cp * (1 + q / 100);
    return mcq(r, {
      prompt: `A trader makes a ${p}% profit by selling an article for ${rupees(sp)}. At what price should it be sold to make a ${q}% profit?`,
      correct: rupees(ans),
      distractors: [rupees(Math.round(sp * (1 + (q - p) / 100))), rupees(Math.round(sp * (1 + q / 100))), rupees(ans + 100), rupees(ans - 100)],
      explanation: `First recover CP: ${rupees(sp)} ÷ ${fmt(1 + p / 100)} = ${rupees(cp)}. Then ${rupees(cp)} × ${fmt(1 + q / 100)} = ${rupees(ans)}.`,
    });
  },
  (r) => {
    const [w1, w2] = [r.int(1, 4) * 10, r.int(1, 4) * 10];
    const [p1, p2] = [r.int(20, 35) * 2, r.int(36, 50) * 2];
    const g = r.pick([10, 20, 25]);
    const avg = (w1 * p1 + w2 * p2) / (w1 + w2);
    const ans = avg * (1 + g / 100);
    return mcq(r, {
      prompt: `${w1} kg of rice at ₹${p1}/kg is mixed with ${w2} kg of rice at ₹${p2}/kg. At what price per kg must the mixture be sold to make a ${g}% profit?${dpNote(2, ans)}`,
      correct: `₹${fmt(ans)}`,
      distractors: [`₹${fmt(((p1 + p2) / 2) * (1 + g / 100))}`, `₹${fmt(avg)}`, `₹${fmt(ans + 2)}`, `₹${fmt(ans - 1.5)}`],
      explanation: `Cost of the mix = (${w1}×${p1} + ${w2}×${p2}) ÷ ${w1 + w2} = ₹${fmt(avg)}/kg (a weighted average). × ${fmt(1 + g / 100)} = ₹${fmt(ans)}.`,
    });
  },
];

// ── Time & work, pipes ──────────────────────────────────────────────────────
export const workExtras: Gen[] = [
  (r) => {
    const [a, b] = r.pick([[20, 30], [12, 18], [10, 15], [15, 20], [6, 10], [8, 12], [4, 6], [9, 12]] as const);
    const ans = (a * b) / (b - a);
    return mcq(r, {
      prompt: `A pipe can fill a tank in ${a} minutes. A leak can empty the full tank in ${b} minutes. If both are open, how long will the tank take to fill?`,
      correct: `${fmt(ans)} minutes`,
      distractors: [`${fmt((a * b) / (a + b))} minutes`, `${b - a} minutes`, `${a + b} minutes`, `${fmt(ans / 2)} minutes`],
      explanation: `Net rate = 1/${a} − 1/${b} = ${fraction(b - a, a * b)} of the tank per minute, so it fills in ${fmt(ans)} minutes. A leak is a negative rate.`,
    });
  },
  (r) => {
    const [a, b, c] = r.pick([[12, 18, 36], [10, 15, 30], [6, 8, 24], [20, 30, 60], [8, 12, 24], [15, 20, 60]] as const);
    const ans = 1 / (1 / a + 1 / b - 1 / c);
    return mcq(r, {
      prompt: `Pipes A and B can fill a tank in ${a} hours and ${b} hours. Pipe C can empty it in ${c} hours. If all three are opened together, how long will the tank take to fill?`,
      correct: `${fmt(ans)} hours`,
      distractors: [`${fmt((a * b) / (a + b))} hours`, `${fmt(1 / (1 / a + 1 / b + 1 / c))} hours`, `${fmt(ans + 2)} hours`, `${fmt((a + b + c) / 3)} hours`],
      explanation: `Net rate = 1/${a} + 1/${b} − 1/${c}. Over a common denominator this is 1/${fmt(ans)}, so ${fmt(ans)} hours.`,
    });
  },
  (r) => {
    const x = r.pick([25, 50, 100]);
    const d = x === 25 ? r.int(2, 8) * 5 : x === 50 ? r.int(4, 12) * 3 : r.int(5, 15) * 2;
    const ans = d / (1 + x / 100);
    return mcq(r, {
      prompt: `A is ${x}% more efficient than B. B alone can finish a job in ${d} days. How many days will A alone take?`,
      correct: `${fmt(ans)} days`,
      distractors: [`${fmt(d * 0.75)} days`, `${fmt(d * (1 + x / 100))} days`, `${fmt(ans + 2)} days`, `${fmt(d - 2)} days`],
      explanation: `A does ${fmt(1 + x / 100)}× B's work per day, so A takes ${d} ÷ ${fmt(1 + x / 100)} = ${fmt(ans)} days. Time is inversely proportional to efficiency.`,
    });
  },
  (r) => {
    // d is even, so d/2 always works: the answer is a whole number of workers.
    const [w, d] = [r.int(4, 12), 2 * r.int(3, 12)];
    const total = w * d;
    const D = r.pick(Array.from({ length: 39 }, (_, i) => i + 2).filter((x) => x !== d && total % x === 0));
    const ans = total / D;
    return mcq(r, {
      prompt: `${w} workers can finish a job in ${d} days. Working at the same rate, how many workers are needed to finish it in ${D} days?`,
      correct: fmt(ans),
      distractors: [fmt((w * D) / d), fmt(ans + 2), fmt(Math.abs(ans - 1) || ans + 3), fmt(w + Math.abs(d - D))],
      explanation: `Workers × days stays the same: ${w} × ${d} = ${total}. ${total} ÷ ${D} = ${fmt(ans)} workers.`,
    });
  },
  (r) => {
    const [p, q] = r.pick([[3, 5], [2, 3], [3, 4], [5, 8], [2, 5], [4, 7]] as const);
    const n = p * r.int(2, 6);
    const ans = (n * q) / p;
    return mcq(r, {
      prompt: `A worker completes ${p}/${q} of a job in ${n} days. At the same rate, how many days will the whole job take?`,
      correct: `${fmt(ans)} days`,
      distractors: [`${fmt((n * p) / q)} days`, `${n + q - p} days`, `${fmt(ans + q)} days`, `${fmt(ans - p)} days`],
      explanation: `${p}/${q} takes ${n} days, so the whole job takes ${n} × ${q}/${p} = ${fmt(ans)} days.`,
    });
  },
];

// ── Speed, time & distance ──────────────────────────────────────────────────
export const speedExtras: Gen[] = [
  (r) => {
    const [l1, l2] = [r.int(2, 6) * 50, r.int(2, 6) * 50];
    const [v1, v2] = r.shuffle([36, 45, 54, 72, 90]).slice(0, 2);
    const rel = ((v1 + v2) * 5) / 18;
    const ans = (l1 + l2) / rel;
    return mcq(r, {
      prompt: `Two trains ${l1} m and ${l2} m long run in opposite directions at ${v1} km/h and ${v2} km/h. How long do they take to cross each other completely?${dpNote(2, ans)}`,
      correct: `${fmt(ans)} seconds`,
      distractors: [`${fmt((l1 + l2) / ((Math.abs(v1 - v2) * 5) / 18))} seconds`, `${fmt(Math.max(l1, l2) / rel)} seconds`, `${fmt((l1 + l2) / (v1 + v2))} seconds`, `${fmt(ans + 3)} seconds`],
      explanation: `Opposite directions: add speeds, ${v1 + v2} km/h = ${fmt(rel)} m/s. Distance = ${l1} + ${l2} = ${l1 + l2} m. Time = ${l1 + l2} ÷ ${fmt(rel)} = ${fmt(ans)} s.`,
    });
  },
  (r) => {
    const [v1, v2] = r.pick([[4, 5], [5, 6], [3, 4], [6, 8], [4, 6], [10, 12]] as const);
    const perKm = (60 * (v2 - v1)) / (v1 * v2); // minutes saved per km
    let dist = 0;
    for (let k = 1; k < 100 && !dist; k++) if (Number.isInteger(k * perKm) && k * perKm >= 20) dist = k;
    const totalMin = dist * perKm;
    const late = r.int(5, totalMin - 5);
    const early = totalMin - late;
    return mcq(r, {
      prompt: `Walking at ${v1} km/h, a student reaches college ${late} minutes late. Walking at ${v2} km/h, they arrive ${early} minutes early. How far is the college?`,
      correct: `${dist} km`,
      distractors: [`${dist + v1} km`, `${Math.max(dist - v1, 1)} km`, `${fmt((dist * v2) / v1)} km`, `${dist * 2} km`],
      explanation: `The two times differ by ${late} + ${early} = ${totalMin} minutes. D/${v1} − D/${v2} = ${fraction(totalMin, 60)} hours → D × ${fraction(v2 - v1, v1 * v2)} = ${fraction(totalMin, 60)} → D = ${dist} km.`,
    });
  },
  (r) => {
    const x = r.pick([20, 25, 50, 60, 100]);
    const ans = (x / (100 + x)) * 100;
    return mcq(r, {
      prompt: `A cyclist increases their speed by ${x}%. By what percentage does the time taken for the same distance fall?${dpNote(2, ans)}`,
      correct: pc(ans),
      distractors: [pc(x), pc(x / 2), pc(ans + 5), pc(Math.max(ans - 5, 1))],
      explanation: `Time ∝ 1/speed: new time = 1/${fmt(1 + x / 100)} = ${fmt(100 / (1 + x / 100))}% of the old, a fall of ${fmt(ans)}%.`,
    });
  },
  (r) => {
    const a = r.int(3, 9);
    const b = a + r.int(1, 5);
    const t = r.pick([15, 30, 45, 90, 120]);
    const ans = ((a + b) * t) / 60;
    return mcq(r, {
      prompt: `Two people start from the same point and walk in opposite directions at ${a} km/h and ${b} km/h. How far apart are they after ${t} minutes?`,
      correct: `${fmt(ans)} km`,
      distractors: [`${fmt(((b - a) * t) / 60)} km`, `${fmt(ans * 2)} km`, `${fmt(ans + 1.5)} km`, `${fmt((b * t) / 60)} km`],
      explanation: `Moving apart, their speeds add: ${a + b} km/h × ${t}/60 h = ${fmt(ans)} km.`,
    });
  },
];

// ── Ratio & mixtures ────────────────────────────────────────────────────────
export const ratioExtras: Gen[] = [
  (r) => {
    const [a, b, c, d] = r.pick([[3, 2, 3, 5], [4, 1, 3, 2], [5, 3, 5, 7], [7, 3, 7, 5], [2, 1, 1, 1], [3, 1, 3, 2]] as const);
    const unit = (a * c) / gcd(a, c);
    const milk = unit * r.int(3, 8);
    const water = (milk * b) / a;
    const add = (milk * d) / c - water;
    return mcq(r, {
      prompt: `A ${milk + water} litre mixture has milk and water in the ratio ${a}:${b}. How much water must be added to make the ratio ${c}:${d}?`,
      correct: `${fmt(add)} L`,
      distractors: [`${fmt((milk * d) / c)} L`, `${fmt(add * 2)} L`, `${fmt(add + water)} L`, `${fmt(add / 2)} L`, `${fmt(milk)} L`],
      explanation: `Milk stays at ${milk} L. For ${c}:${d}, water must be ${milk} × ${d}/${c} = ${fmt((milk * d) / c)} L. It is now ${water} L, so add ${fmt(add)} L.`,
    });
  },
  (r) => {
    const v = r.pick([40, 60, 80, 100, 120]);
    const x = v / r.pick([4, 5, 10]);
    const times = r.int(2, 3);
    const ans = v * (1 - x / v) ** times;
    return mcq(r, {
      prompt: `A vessel holds ${v} litres of milk. ${x} litres are taken out and replaced with water. This is done ${times === 2 ? "twice" : "three times"} in all. How much milk is left?${dpNote(2, ans)}`,
      correct: `${fmt(ans)} L`,
      distractors: [`${fmt(v - times * x)} L`, `${fmt(v * (1 - x / v))} L`, `${fmt(ans + x / 2)} L`, `${fmt(ans - 2)} L`],
      explanation: `Each round keeps ${fraction(v - x, v)} of the milk: ${v} × (${fraction(v - x, v)})^${times} = ${fmt(ans)} L.`,
    });
  },
  (r) => {
    const [p, q] = r.pick([[3, 4], [2, 3], [5, 7], [4, 5], [3, 5]] as const);
    const [s, t] = r.pick([[8, 9], [6, 7], [14, 15], [10, 11], [4, 3]] as const);
    const g = gcd(p * s, q * t);
    return mcq(r, {
      prompt: `If A:B = ${p}:${q} and B:C = ${s}:${t}, what is A:C?`,
      correct: `${(p * s) / g}:${(q * t) / g}`,
      // Drop any wrong option that is the same ratio in other words (e.g. 3:3 when the answer is 1:1).
      distractors: [`${p}:${t}`, `${(q * t) / g}:${(p * s) / g}`, `${p * s}:${q * t + 1}`, `${(p * s) / g + 1}:${(q * t) / g}`, `${(p * s) / g}:${(q * t) / g + 1}`].filter((o) => {
        const [u, v] = o.split(":").map(Number);
        return u * q * t !== v * p * s;
      }),
      explanation: `Make B the same in both: A:B = ${p * s}:${q * s} and B:C = ${q * s}:${q * t}. So A:C = ${p * s}:${q * t} = ${(p * s) / g}:${(q * t) / g}.`,
    });
  },
  (r) => {
    // Girls' share rises (c > b) and the new ratio stays in lowest terms.
    const [a, b, c] = r.pick([[7, 5, 6], [3, 2, 5], [4, 3, 5], [5, 4, 6], [8, 5, 7], [5, 3, 4]] as const);
    const x = r.int(4, 15);
    const k = x * (c - b);
    return mcq(r, {
      prompt: `In a class, boys and girls are in the ratio ${a}:${b}. When ${k} more girls join, the ratio becomes ${a}:${c}. How many students were there at first?`,
      correct: String((a + b) * x),
      distractors: [String((a + c) * x), String((a + b) * x + k), String((a + b) * (x + 1)), String(a * x)],
      explanation: `Boys = ${a}x stay fixed: ${a}x/(${b}x + ${k}) = ${a}/${c} → ${c}x = ${b}x + ${k} → x = ${x}. Total = ${a + b}x = ${(a + b) * x}.`,
    });
  },
];

// ── Number system ───────────────────────────────────────────────────────────
export const numberExtras: Gen[] = [
  (r) => {
    const [base, mod] = r.pick([[2, 7], [3, 7], [2, 5], [3, 5], [2, 9], [5, 7], [3, 8]] as const);
    const exp = r.int(20, 99);
    let rem = 1;
    for (let i = 0; i < exp; i++) rem = (rem * base) % mod;
    const others = r.shuffle(Array.from({ length: mod }, (_, i) => i).filter((i) => i !== rem)).slice(0, 4).map(String);
    // The cycle length, for the explanation.
    let cycle = 1;
    for (let v = base % mod; v !== 1 && cycle < mod; cycle++) v = (v * base) % mod;
    return mcq(r, {
      prompt: `What is the remainder when ${base}^${exp} is divided by ${mod}?`,
      correct: String(rem),
      distractors: others,
      explanation: `Powers of ${base} mod ${mod} repeat every ${cycle}: ${Array.from({ length: cycle }, (_, i) => { let v = 1; for (let j = 0; j <= i; j++) v = (v * base) % mod; return v; }).join(", ")}. ${exp} mod ${cycle} = ${exp % cycle || cycle}, so the remainder is ${rem}.`,
    });
  },
  (r) => {
    const g = r.int(5, 19);
    const rem = r.int(1, g - 1);
    const ks = r.shuffle(Array.from({ length: 30 }, (_, i) => i + 8)).slice(0, 3).sort((a, b) => a - b);
    const nums = ks.map((k) => g * k + rem);
    const ans = gcd(gcd(nums[1] - nums[0], nums[2] - nums[1]), nums[2] - nums[0]);
    return mcq(r, {
      prompt: `What is the greatest number that divides ${nums.join(", ")} leaving the same remainder each time?`,
      correct: String(ans),
      distractors: [String(gcd(gcd(nums[0], nums[1]), nums[2])), String(ans * 2), String(rem), String(ans + 1)],
      explanation: `If each leaves the same remainder, the number divides their differences: ${nums[1] - nums[0]}, ${nums[2] - nums[1]}, ${nums[2] - nums[0]}. HCF of these = ${ans}.`,
    });
  },
  (r) => {
    const h = r.int(4, 15);
    const [x, y] = r.pick([[2, 3], [3, 4], [3, 5], [4, 5], [5, 7], [2, 7], [3, 7]] as const);
    const lcmv = h * x * y;
    return mcq(r, {
      prompt: `The HCF of two numbers is ${h} and their LCM is ${lcmv}. One number is ${h * x}. What is the other?`,
      correct: String(h * y),
      distractors: [String(lcmv / h), String(h * x * 2), String(h * y + h), String(lcmv / x)],
      explanation: `HCF × LCM = product of the numbers: ${h} × ${lcmv} = ${h * lcmv}. ${h * lcmv} ÷ ${h * x} = ${h * y}.`,
    });
  },
  (r) => {
    const d = r.pick([7, 9, 11, 13]);
    let n = r.int(1000, 9999);
    if (n % d === 0) n += 1;
    const add = (d - (n % d)) % d;
    return mcq(r, {
      prompt: `What is the smallest number that must be added to ${n} to make it divisible by ${d}?`,
      correct: String(add),
      distractors: [String(n % d), String(add + 1), String(Math.abs(add - 1) || add + 2), String(d)],
      explanation: `${n} ÷ ${d} leaves a remainder of ${n % d}. Adding ${d} − ${n % d} = ${add} reaches the next multiple, ${n + add}.`,
    });
  },
];

// ── Permutation & combination ───────────────────────────────────────────────
export const pncExtras: Gen[] = [
  (r) => {
    const n = r.int(5, 8);
    const ans = fact(n - 2) * 2;
    return mcq(r, {
      prompt: `In how many ways can ${n} people sit around a round table if two particular people must always sit next to each other?`,
      correct: String(ans),
      distractors: [String(fact(n - 1)), String(fact(n - 2)), String(fact(n - 1) * 2), String(fact(n) / 2)],
      explanation: `Treat the pair as one unit: ${n - 1} units round a table give (${n - 1} − 1)! = ${fact(n - 2)} ways, and the pair can swap: × 2 = ${ans}.`,
    });
  },
  (r) => {
    const k = r.int(6, 9);
    const m = r.int(3, 5);
    const ans = P(k - 1, m - 1);
    return mcq(r, {
      prompt: `How many ${m}-digit numbers divisible by 5 can be made from the digits 1 to ${k}, with no digit repeated?`,
      correct: String(ans),
      distractors: [String(P(k, m)), String(P(k - 1, m)), String(Math.round(P(k, m) / 5)), String(ans * 2)],
      explanation: `The last digit must be 5 (there's no 0). The other ${m - 1} places use the remaining ${k - 1} digits: P(${k - 1}, ${m - 1}) = ${ans}.`,
    });
  },
  (r) => {
    const [a, x] = [r.int(5, 7), r.int(2, 3)];
    const [b, y] = [r.int(5, 8), 2];
    const ans = P(a, x) * P(b, y);
    return mcq(r, {
      prompt: `A password is ${x} different letters chosen from ${a} letters, followed by ${y} different digits chosen from ${b} digits. How many passwords are possible?`,
      correct: ans.toLocaleString("en-IN"),
      distractors: [(C(a, x) * C(b, y)).toLocaleString("en-IN"), (a ** x * b ** y).toLocaleString("en-IN"), (P(a, x) + P(b, y)).toLocaleString("en-IN"), (ans * 2).toLocaleString("en-IN")],
      explanation: `Order matters, so use permutations: P(${a}, ${x}) × P(${b}, ${y}) = ${P(a, x)} × ${P(b, y)} = ${ans.toLocaleString("en-IN")}.`,
    });
  },
  (r) => {
    const [men, women, k] = [r.int(4, 7), r.int(3, 6), r.int(3, 5)];
    let ans = 0;
    const parts: string[] = [];
    for (let j = 2; j <= Math.min(k, women); j++) {
      ans += C(women, j) * C(men, k - j);
      parts.push(`C(${women},${j})×C(${men},${k - j})`);
    }
    return mcq(r, {
      prompt: `A committee of ${k} is chosen from ${men} men and ${women} women. In how many ways can it be formed with at least 2 women?`,
      correct: String(ans),
      distractors: [String(C(women, 2) * C(men, k - 2)), String(C(men + women, k)), String(C(women, 2) * C(men + women - 2, k - 2)), String(ans + C(men, k))],
      explanation: `"At least 2" means 2, 3, … women: ${parts.join(" + ")} = ${ans}.`,
    });
  },
];

// ── Probability ─────────────────────────────────────────────────────────────
export const probExtras: Gen[] = [
  (r) => {
    const n = r.int(3, 4);
    const k = r.int(1, n - 1);
    const num = C(n, k) * 5 ** (n - k);
    const den = 6 ** n;
    return mcq(r, {
      prompt: `A fair die is rolled ${n} times. What is the probability of getting exactly ${k} six${k > 1 ? "es" : ""}?`,
      correct: fraction(num, den),
      distractors: [fraction(5 ** (n - k), den), fraction(k, 6), fraction(C(n, k), 6 ** k), fraction(num + 5, den)],
      explanation: `Choose which ${k} rolls are sixes: C(${n},${k}) = ${C(n, k)}. Each such pattern has probability (1/6)^${k} × (5/6)^${n - k}. Total = ${num}/${den} = ${fraction(num, den)}.`,
    });
  },
  (r) => {
    const [d, g] = [r.int(2, 5), r.int(4, 8)];
    return mcq(r, {
      prompt: `A box has ${d} defective and ${g} good components. Two are picked at random. What is the probability that at least one is defective?`,
      correct: fraction(C(d + g, 2) - C(g, 2), C(d + g, 2)),
      distractors: [fraction(C(g, 2), C(d + g, 2)), fraction(C(d, 2), C(d + g, 2)), fraction(d, d + g), fraction(d * g, C(d + g, 2))],
      explanation: `Use the complement: P(no defective) = C(${g},2)/C(${d + g},2) = ${fraction(C(g, 2), C(d + g, 2))}. So P(at least one) = 1 − ${fraction(C(g, 2), C(d + g, 2))} = ${fraction(C(d + g, 2) - C(g, 2), C(d + g, 2))}.`,
    });
  },
  (r) => {
    const [label, count] = r.pick([["aces", 4], ["kings", 4], ["hearts", 13], ["face cards", 12], ["red cards", 26]] as const);
    const num = count * (count - 1);
    const den = 52 * 51;
    return mcq(r, {
      prompt: `Two cards are drawn one after the other, without replacement, from a standard deck of 52. What is the probability that both are ${label}?`,
      correct: fraction(num, den),
      distractors: [fraction(count * count, 52 * 52), fraction(count, 52), fraction(2 * count, 52), fraction(num, 52 * 52)],
      explanation: `${count}/52 × ${count - 1}/51 = ${num}/${den} = ${fraction(num, den)}. Without replacement, the second draw is out of 51.`,
    });
  },
];

// ── Mensuration & interest ──────────────────────────────────────────────────
export const mensurationExtras: Gen[] = [
  (r) => {
    const a = r.int(3, 12);
    return mcq(r, {
      prompt: `The total surface area of a cube is ${6 * a * a} cm². What is its volume?`,
      correct: `${a ** 3} cm³`,
      distractors: [`${6 * a * a} cm³`, `${(a + 1) ** 3} cm³`, `${a * a} cm³`, `${(a - 1) ** 3 || 1} cm³`],
      explanation: `6a² = ${6 * a * a} → a² = ${a * a} → a = ${a} cm. Volume = ${a}³ = ${a ** 3} cm³.`,
    });
  },
  (r) => {
    const [l, b, h] = [r.int(6, 15), r.int(4, 10), r.int(2, 8)];
    const tsa = 2 * (l * b + b * h + l * h);
    return mcq(r, {
      prompt: `A cuboid measures ${l} cm × ${b} cm × ${h} cm. What is its total surface area?`,
      correct: `${tsa} cm²`,
      distractors: [`${l * b * h} cm²`, `${l * b + b * h + l * h} cm²`, `${tsa + 2 * l} cm²`, `${2 * h * (l + b)} cm²`],
      explanation: `TSA = 2(lb + bh + lh) = 2(${l * b} + ${b * h} + ${l * h}) = ${tsa} cm².`,
    });
  },
  (r) => {
    const k = r.pick([2, 3]);
    const [m, mText] = r.pick([[1, "stays the same"], [2, "is doubled"], [0.5, "is halved"]] as const);
    const ans = k * k * m;
    return mcq(r, {
      prompt: `The radius of a cylinder is multiplied by ${k} and its height ${mText}. How many times the original volume is the new volume?`,
      correct: `${fmt(ans)} times`,
      distractors: [`${fmt(k * m)} times`, `${fmt(k ** 3 * m)} times`, `${fmt(ans + 1)} times`, `${fmt(2 * k * m)} times`],
      explanation: `V = πr²h. r × ${k} makes r² × ${k * k}; the height factor is ${fmt(m)}. ${k * k} × ${fmt(m)} = ${fmt(ans)}.`,
    });
  },
  (r) => {
    const [a0, b0, c0] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]] as const);
    const s = a0 === 3 ? r.int(1, 4) : 1;
    const [a, b, c] = [a0 * s, b0 * s, c0 * s];
    const ans = (a + b - c) / 2;
    return mcq(r, {
      prompt: `A right-angled triangle has legs of ${a} cm and ${b} cm. What is the radius of its inscribed circle?`,
      correct: `${fmt(ans)} cm`,
      distractors: [`${fmt(c / 2)} cm`, `${fmt(ans + 1)} cm`, `${fmt(ans * 2)} cm`, `${fmt(ans + 0.5)} cm`],
      explanation: `Hypotenuse = √(${a}² + ${b}²) = ${c}. For a right triangle, r = (a + b − c)/2 = (${a} + ${b} − ${c})/2 = ${fmt(ans)} cm.`,
    });
  },
  (r) => {
    const [b, d] = [r.int(5, 20), r.int(2, 9)];
    const l = b + d;
    return mcq(r, {
      prompt: `A rectangle has a perimeter of ${2 * (l + b)} cm, and its length is ${d} cm more than its breadth. What is its area?`,
      correct: `${l * b} cm²`,
      distractors: [`${(l + 1) * (b + 1)} cm²`, `${((l + b) / 2) ** 2} cm²`, `${l * b + d} cm²`, `${2 * (l + b) * d} cm²`],
      explanation: `l + b = ${l + b} and l − b = ${d}, so l = ${l} and b = ${b}. Area = ${l} × ${b} = ${l * b} cm².`,
    });
  },
];

export const interestExtras: Gen[] = [
  (r) => {
    const p = r.int(4, 40) * 500;
    const [rate, t] = [r.pick([5, 6, 8, 10, 12]), r.int(2, 5)];
    const si = (p * rate * t) / 100;
    return mcq(r, {
      prompt: `The simple interest on a sum for ${t} years at ${rate}% per year is ${rupees(si)}. What is the sum?`,
      correct: rupees(p),
      distractors: [rupees(si * rate), rupees(p + 500), rupees(Math.round((si * 100) / rate)), rupees(p - 500)],
      explanation: `SI = P × R × T / 100 → ${si} = P × ${rate} × ${t} / 100 → P = ${rupees(p)}.`,
    });
  },
  (r) => {
    const rate = r.pick([10, 20]);
    const p = r.int(5, 30) * 1000;
    const amt = p * (1 + rate / 100) ** 2;
    return mcq(r, {
      prompt: `A sum grows to ${rupees(Math.round(amt))} in 2 years at ${rate}% compound interest per year. What was the sum?`,
      correct: rupees(p),
      distractors: [rupees(Math.round(amt / (1 + (2 * rate) / 100))), rupees(p + 1000), rupees(Math.round(amt * (1 - (2 * rate) / 100))), rupees(p - 500)],
      explanation: `Amount = P × (1 + ${rate}/100)² → P = ${rupees(Math.round(amt))} ÷ ${fmt((1 + rate / 100) ** 2)} = ${rupees(p)}.`,
    });
  },
];

// ── Algebra (new topic) ─────────────────────────────────────────────────────
export const algebraGens: Gen[] = [
  (r) => {
    const k = r.int(3, 9);
    const minus = r.int(0, 1) === 1;
    const ans = minus ? k * k + 2 : k * k - 2;
    return mcq(r, {
      prompt: `If x ${minus ? "−" : "+"} 1/x = ${k}, what is x² + 1/x²?`,
      correct: String(ans),
      distractors: [String(k * k), String(minus ? k * k - 2 : k * k + 2), String(2 * k), String(ans + 1)],
      explanation: `Square both sides: x² ${minus ? "−" : "+"} 2 + 1/x² = ${k * k}, so x² + 1/x² = ${k * k} ${minus ? "+" : "−"} 2 = ${ans}. Don't drop the middle term.`,
    });
  },
  (r) => {
    const [x, y] = [r.int(2, 12), r.int(1, 10)];
    const [p, q] = r.pick([[2, 3], [3, 2], [4, 3], [5, 2], [3, 4]] as const);
    return mcq(r, {
      prompt: `If ${p}x − ${q}y = ${signed(p * x - q * y)} and x + y = ${x + y}, what is x?`,
      correct: String(x),
      distractors: [String(y), String(x + 1), String(x + y - 1 === x ? x + 2 : x + y - 1), String(Math.abs(x - 2) || x + 3)],
      explanation: `From x + y = ${x + y}, y = ${x + y} − x. Then ${p}x − ${q}(${x + y} − x) = ${signed(p * x - q * y)} → ${p + q}x = ${p * x - q * y + q * (x + y)} → x = ${x}.`,
    });
  },
  (r) => {
    const b = r.int(2, 10);
    const a = b + r.int(1, 8);
    return mcq(r, {
      prompt: `Two positive numbers add up to ${a + b} and their product is ${a * b}. What is their difference?`,
      correct: String(a - b),
      distractors: [String(a - b + 2), String(a - b + 1), String(a), String(b)],
      explanation: `(a − b)² = (a + b)² − 4ab = ${(a + b) ** 2} − ${4 * a * b} = ${(a - b) ** 2}, so the difference is ${a - b}.`,
    });
  },
  (r) => {
    const [r1, r2] = r.pick([[1, 4], [2, 3], [1, 6], [2, 5], [3, 4], [1, 8], [2, 6]] as const);
    const show = (u: number, v: number) => `${u} and ${v}`;
    return mcq(r, {
      prompt: `For positive x, x + ${r1 * r2}/x = ${r1 + r2}. What are the possible values of x?`,
      correct: show(r1, r2),
      // A wrong option must not be the right pair in another order (or any pair of real roots).
      distractors: [[r1 + 1, r2 - 1 || r2 + 1], [r1, r1 + r2], [-r1, -r2], [r2, r1 * r2], [r1 + 1, r2 + 1]]
        .filter(([u, v]) => !(u * u - (r1 + r2) * u + r1 * r2 === 0 && v * v - (r1 + r2) * v + r1 * r2 === 0))
        .map(([u, v]) => show(u, v)),
      explanation: `Multiply by x: x² − ${r1 + r2}x + ${r1 * r2} = 0 → (x − ${r1})(x − ${r2}) = 0, so x = ${r1} or ${r2}. Both are positive.`,
    });
  },
  (r) => {
    // [base, result, d, x] with x(x − d) = base^result and x > d.
    const [b, n, d, x] = r.pick([[2, 3, 2, 4], [2, 4, 6, 8], [3, 2, 8, 9], [2, 5, 4, 8], [3, 3, 6, 9]] as const);
    const other = d - x; // the root the domain throws away (negative)
    return mcq(r, {
      prompt: `If log${b}(x) + log${b}(x − ${d}) = ${n}, what is x?`,
      correct: String(x),
      distractors: [String(other), String(b ** n), String(x + d), String(x - 1)],
      explanation: `log${b}[x(x − ${d})] = ${n} → x(x − ${d}) = ${b ** n} → x = ${x} or ${other}. Logs need x > ${d}, so x = ${x}.`,
    });
  },
];

// ── Progressions (new topic) ────────────────────────────────────────────────
export const progressionGens: Gen[] = [
  (r) => {
    const [a, d] = [r.int(1, 20), r.int(2, 9)];
    const m = r.int(3, 8);
    const n = m + r.int(3, 7);
    const k = n + r.int(3, 9);
    const T = (i: number) => a + (i - 1) * d;
    return mcq(r, {
      prompt: `In an arithmetic progression, the ${m}th term is ${T(m)} and the ${n}th term is ${T(n)}. What is the ${k}th term?`,
      correct: String(T(k)),
      distractors: [String(T(k) + d), String(T(k) - d), String(T(n) + (k - n) * (d + 1)), String(T(m) + (k - m) * (d - 1))],
      explanation: `${n - m}d = ${T(n)} − ${T(m)} = ${T(n) - T(m)}, so d = ${d}. T${k} = T${n} + ${k - n}d = ${T(n)} + ${(k - n) * d} = ${T(k)}.`,
    });
  },
  (r) => {
    const [k, n] = [r.int(2, 9), r.int(10, 30)];
    const ans = (k * n * (n + 1)) / 2;
    return mcq(r, {
      prompt: `What is the sum of the first ${n} positive multiples of ${k}?`,
      correct: String(ans),
      distractors: [String(k * n * n), String((k * n * (n - 1)) / 2), String(ans + k), String((n * (n + 1)) / 2)],
      explanation: `${k} + ${2 * k} + … + ${k * n} = ${k} × (1 + 2 + … + ${n}) = ${k} × ${(n * (n + 1)) / 2} = ${ans}.`,
    });
  },
  (r) => {
    const [a, d, n] = [r.int(3, 20), r.int(2, 8), r.pick([8, 10, 12, 15])];
    const avg = a + ((n - 1) * d) / 2;
    return mcq(r, {
      prompt: `The average of the first ${n} terms of an arithmetic progression is ${fmt(avg)}, and its first term is ${a}. What is the common difference?`,
      correct: String(d),
      distractors: [String(d + 1), String(d - 1 || d + 2), String(fmt((avg - a) / n)), String(d * 2)],
      explanation: `Average = (first + last)/2 → last = 2 × ${fmt(avg)} − ${a} = ${a + (n - 1) * d}. Then ${a + (n - 1) * d} = ${a} + ${n - 1}d → d = ${d}.`,
    });
  },
  (r) => {
    const c = r.pick([5, 7]);
    const mid = 2 * r.int(8, 30) + 1;
    const lo = mid - (c - 1);
    const hi = mid + (c - 1);
    return mcq(r, {
      prompt: `The average of ${c} consecutive odd numbers is ${mid}. What is the product of the smallest and the largest?`,
      correct: String(lo * hi),
      distractors: [String((lo + 2) * (hi - 2)), String(mid * mid), String((lo - 2) * (hi + 2)), String(lo * hi + 4)],
      explanation: `With an odd count, the average is the middle number. The numbers run from ${lo} to ${hi}, so the product is ${lo} × ${hi} = ${lo * hi}.`,
    });
  },
  (r) => {
    const [p, c] = [r.pick([2, 3]), r.int(-1, 3)];
    const terms = [r.int(2, 6)];
    while (terms.length < 6) terms.push(terms[terms.length - 1] * p + c);
    const next = terms[5];
    const op = c === 0 ? "" : c > 0 ? ` + ${c}` : ` − ${-c}`;
    return mcq(r, {
      prompt: `What is the next term in the series ${terms.slice(0, 5).join(", ")}, …?`,
      correct: String(next),
      distractors: [String(next + 2), String(terms[4] * p), String(next - 4), String(terms[4] + (terms[4] - terms[3]))],
      explanation: `Each term is the previous × ${p}${op}: ${terms[4]} × ${p}${op} = ${next}.`,
    });
  },
];
