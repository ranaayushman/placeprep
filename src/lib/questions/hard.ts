/**
 * Hard tier. A mock mixes these with the standard questions (refs "<topic>:<seed>:h").
 *
 * Every hard question takes several steps or combines two ideas, and each wrong option is the result
 * of one named mistake. Answers are computed, mostly by brute force over all cases, never typed in.
 */
import { DAYS, DS_OPTIONS, MONTHS } from "./reasoning";
import { fraction, gcd, lcm, mcq, rng, type Rng } from "./rng";
import type { Question } from "./types";

type Gen = (r: Rng) => Question;
const fromHard = (gens: Gen[]) => (seed: number) => {
  const r = rng((seed ^ 0x2545f491) >>> 0);
  return gens[r.int(0, gens.length - 1)](r);
};
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const C = (n: number, k: number) => (k < 0 || k > n ? 0 : fact(n) / (fact(k) * fact(n - k)));
const inr = (n: number) => n.toLocaleString("en-IN");
const rupees = (n: number) => `₹${inr(n)}`;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const count = <T>(xs: T[], f: (x: T) => boolean) => xs.reduce((s, x) => s + (f(x) ? 1 : 0), 0);
/** "13 1/3" style for days, hours etc. */
function mixed(num: number, den: number) {
  const g = gcd(num, den);
  const [n, d] = [num / g, den / g];
  if (d === 1) return String(n);
  const whole = Math.floor(n / d);
  return whole ? `${whole} ${n % d}/${d}` : `${n % d}/${d}`;
}
const modpow = (b: number, e: number, m: number) => {
  let out = 1 % m;
  let x = b % m;
  for (let k = e; k > 0; k >>= 1) {
    if (k & 1) out = (out * x) % m;
    x = (x * x) % m;
  }
  return out;
};
/** Retry a builder until it accepts its random parameters (keeps every answer clean). */
function attempt<T>(r: Rng, build: () => T | null): T {
  for (let i = 0; i < 500; i++) {
    const v = build();
    if (v) return v;
  }
  throw new Error("hard generator found no valid parameters");
}

// ── Probability ─────────────────────────────────────────────────────────────
const probHard: Gen[] = [
  (r) => {
    const S = r.int(6, 15);
    const rolls = range(1, 6).flatMap((a) => range(1, 6).flatMap((b) => range(1, 6).map((c) => [a, b, c])));
    const ways = (s: number) => count(rolls, ([a, b, c]) => a + b + c === s);
    const unordered = count(rolls, ([a, b, c]) => a <= b && b <= c && a + b + c === S);
    return mcq(r, {
      prompt: `Three fair dice are rolled together. What is the probability that the numbers shown add up to ${S}?`,
      correct: fraction(ways(S), 216),
      distractors: [fraction(unordered, 216), fraction(ways(S - 1), 216), fraction(ways(S + 1), 216), fraction(unordered, 56)],
      explanation: `There are 6³ = 216 equally likely ordered outcomes. Counting the ordered triples with sum ${S} gives ${ways(S)}, so the probability is ${ways(S)}/216 = ${fraction(ways(S), 216)}. Trap: counting only the ${unordered} unordered combinations (e.g. treating 1-2-3 and 3-2-1 as one outcome).`,
    });
  },
  (r) => {
    const N = r.int(10, 20);
    const k = r.int(3, 5);
    const pairs = range(1, N).flatMap((i) => range(i + 1, N).map((j) => [i, j]));
    const fav = count(pairs, ([i, j]) => (i + j) % k === 0);
    const withRep = count(range(1, N).flatMap((i) => range(1, N).map((j) => [i, j])), ([i, j]) => (i + j) % k === 0);
    return mcq(r, {
      prompt: `Two different numbers are chosen at random from 1, 2, …, ${N}. What is the probability that their sum is divisible by ${k}?`,
      correct: fraction(fav, pairs.length),
      distractors: [fraction(1, k), fraction(withRep, N * N), fraction(fav, N * N), fraction(fav + 1, pairs.length)],
      explanation: `There are C(${N},2) = ${pairs.length} pairs. Group the numbers by remainder mod ${k}; a pair works when the remainders add to 0 or ${k}. Counting gives ${fav} pairs, so the probability is ${fav}/${pairs.length} = ${fraction(fav, pairs.length)}. Trap: 1/${k} assumes the sums are spread evenly, and ${N}×${N} counts a number paired with itself.`,
    });
  },
  (r) => {
    const [a, b, c, d] = [r.int(3, 6), r.int(2, 5), r.int(2, 5), r.int(3, 6)];
    const [x, y] = [C(a, 2), C(a + b, 2)];
    const [u, v] = [C(c, 2), C(c + d, 2)];
    const num = x * v + u * y;
    const den = 2 * y * v;
    return mcq(r, {
      prompt: `Bag X has ${a} red and ${b} blue balls; bag Y has ${c} red and ${d} blue balls. A bag is chosen at random and two balls are drawn from it without replacement. What is the probability that both balls are red?`,
      correct: fraction(num, den),
      distractors: [
        fraction(C(a + c, 2), C(a + b + c + d, 2)),
        fraction(a * a * (c + d) ** 2 + c * c * (a + b) ** 2, 2 * (a + b) ** 2 * (c + d) ** 2),
        fraction(x, y),
        fraction(x * v + u * y, 2 * y * v + y * v),
      ],
      explanation: `P = ½ × C(${a},2)/C(${a + b},2) + ½ × C(${c},2)/C(${c + d},2) = ½ × ${fraction(x, y)} + ½ × ${fraction(u, v)} = ${fraction(num, den)}. Traps: pouring both bags together, or drawing with replacement.`,
    });
  },
];

// ── Permutation & combination ───────────────────────────────────────────────
const VOWELS = new Set(["A", "E", "I", "O", "U"]);
/** Every distinct arrangement of a word (letters may repeat). */
function arrangements(word: string): string[] {
  const counts = new Map<string, number>();
  for (const ch of word) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const out: string[] = [];
  const walk = (cur: string) => {
    if (cur.length === word.length) return void out.push(cur);
    for (const [ch, n] of counts) {
      if (!n) continue;
      counts.set(ch, n - 1);
      walk(cur + ch);
      counts.set(ch, n);
    }
  };
  walk("");
  return out;
}
const pncHard: Gen[] = [
  (r) => {
    const word = r.pick(["ORANGE", "GARDEN", "MANGOES", "COUNTER", "STUDENT", "BALLOON", "SCIENCE", "PENCILS", "EQUATOR", "FAILURE"] as const);
    const all = arrangements(word);
    const isV = (ch: string) => VOWELS.has(ch);
    const together = all.filter((w) => /^[^AEIOU]*[AEIOU]+[^AEIOU]*$/.test(w)).length;
    const apart = all.filter((w) => ![...w].some((ch, i) => i > 0 && isV(ch) && isV(w[i - 1]))).length;
    const vowels = [...word].filter(isV).sort().join("");
    const fixedOrder = all.filter((w) => w.includes(vowels)).length;
    if (r.next() < 0.5) {
      return mcq(r, {
        prompt: `In how many different ways can the letters of the word ${word} be arranged so that no two vowels are next to each other?`,
        correct: inr(apart),
        distractors: [inr(all.length - together), inr(together), inr(all.length), inr(apart * 2)],
        explanation: `Arrange the consonants first, then place the vowels in the gaps between them so no two vowels touch, dividing by repeated letters. That gives ${inr(apart)}. Trap: total − "all vowels together" = ${inr(all.length - together)} still allows two vowels to sit together.`,
      });
    }
    return mcq(r, {
      prompt: `In how many different ways can the letters of the word ${word} be arranged so that all the vowels come together?`,
      correct: inr(together),
      distractors: [inr(fixedOrder), inr(all.length), inr(all.length - together), inr(together * 2)],
      explanation: `Treat the vowels ${vowels.split("").join(", ")} as one block: arrange the block with the consonants, then arrange the vowels inside the block, dividing by repeated letters. That gives ${inr(together)}. Trap: ${inr(fixedOrder)} forgets that the vowels can be rearranged inside the block.`,
    });
  },
  (r) => {
    const maxD = r.int(6, 8);
    const X = r.pick([3000, 4000, 5000, 6000].filter((x) => x / 1000 < maxD));
    const kind = r.pick(["even", "odd", "divisible by 5"] as const);
    const test = (n: number) => (kind === "even" ? n % 2 === 0 : kind === "odd" ? n % 2 === 1 : n % 5 === 0);
    const distinct = (n: number) => new Set(String(n)).size === 4 && [...String(n)].every((ch) => Number(ch) <= maxD);
    const nums = range(1000, 9999).filter(distinct);
    const ans = count(nums, (n) => n > X && test(n));
    const noLimit = count(nums, test);
    const withRep = count(range(1000, 9999).filter((n) => [...String(n)].every((ch) => Number(ch) <= maxD)), (n) => n > X && test(n));
    return mcq(r, {
      prompt: `How many 4-digit numbers greater than ${X} can be formed with the digits 0, 1, …, ${maxD} if no digit is repeated and the number must be ${kind}?`,
      correct: inr(ans),
      distractors: [inr(noLimit), inr(withRep), inr(count(nums, (n) => n >= X && !test(n))), inr(ans + Math.round(ans / 4))],
      explanation: `Fix the first digit (it must make the number exceed ${X}) and the last digit (${kind}), split into cases by whether they share a digit, then fill the middle two places from what is left. The cases add up to ${inr(ans)}. Trap: ignoring the "greater than ${X}" condition gives ${inr(noLimit)}.`,
    });
  },
  (r) => {
    const { n, k, lo, hi, ans } = attempt(r, () => {
      const k = r.int(3, 4);
      const lo = r.int(1, 2);
      const hi = r.int(lo + 2, lo + 4);
      const n = r.int(k * lo + 2, k * hi - 2);
      const ways = (left: number, people: number): number =>
        people === 0 ? (left === 0 ? 1 : 0) : range(lo, hi).reduce((s, v) => s + (v <= left ? ways(left - v, people - 1) : 0), 0);
      const ans = ways(n, k);
      return ans > 3 ? { n, k, lo, hi, ans } : null;
    });
    const noCap = C(n - k * lo + k - 1, k - 1);
    return mcq(r, {
      prompt: `In how many ways can ${n} identical chocolates be distributed among ${k} children so that every child gets at least ${lo} and at most ${hi}?`,
      correct: String(ans),
      distractors: [String(noCap), String(C(n - 1, k - 1)), String(ans * 2), String(Math.max(1, ans - k))],
      explanation: `Give each child ${lo} first, leaving ${n - k * lo} to share with at most ${hi - lo} more each. Without the upper limit there are C(${n - k * lo + k - 1}, ${k - 1}) = ${noCap} ways; removing the cases where someone gets more than ${hi} leaves ${ans}.`,
    });
  },
];

// ── Number system ───────────────────────────────────────────────────────────
const numberHard: Gen[] = [
  (r) => {
    const N = r.pick([500, 600, 800, 1000, 1200, 1500, 2000]);
    const [a, b] = r.pick([[2, 3], [3, 5], [2, 5], [3, 4], [4, 6], [6, 9], [5, 7]] as const);
    const c = r.pick([7, 11, 13].filter((x) => x !== a && x !== b));
    const nums = range(1, N);
    const ans = count(nums, (x) => (x % a === 0 || x % b === 0) && x % c !== 0);
    const union = count(nums, (x) => x % a === 0 || x % b === 0);
    const noAddBack = union - Math.floor(N / lcm(a, c)) - Math.floor(N / lcm(b, c));
    return mcq(r, {
      prompt: `How many integers from 1 to ${inr(N)} are divisible by ${a} or ${b} but not by ${c}?`,
      correct: inr(ans),
      distractors: [inr(union), inr(noAddBack), inr(Math.floor(N / a) + Math.floor(N / b) - Math.floor(N / c)), inr(ans - 1)],
      explanation: `Divisible by ${a} or ${b}: ⌊${N}/${a}⌋ + ⌊${N}/${b}⌋ − ⌊${N}/${lcm(a, b)}⌋ = ${union}. Remove those also divisible by ${c}: ⌊${N}/${lcm(a, c)}⌋ + ⌊${N}/${lcm(b, c)}⌋ − ⌊${N}/${lcm(lcm(a, b), c)}⌋ = ${union - ans}. Answer: ${union} − ${union - ans} = ${ans}. Trap: forgetting to add back the multiples of ${lcm(lcm(a, b), c)} gives ${noAddBack}.`,
    });
  },
  (r) => {
    const k = r.pick([7, 9, 11, 13]);
    const [a, b] = [r.int(2, 9), r.int(2, 9)];
    const [n, m] = [r.int(50, 999), r.int(50, 999)];
    const ans = (modpow(a, n, k) + modpow(b, m, k)) % k;
    const wrong = [(modpow(a, n + 1, k) + modpow(b, m, k)) % k, (modpow(a, n, k) + modpow(b, m - 1, k)) % k, (a + b) % k, (ans + 1) % k];
    return mcq(
      r,
      {
        prompt: `What is the remainder when ${a}^${n} + ${b}^${m} is divided by ${k}?`,
        correct: String(ans),
        distractors: wrong.map(String),
        explanation: `Powers repeat in a cycle modulo ${k}. ${a}^${n} leaves ${modpow(a, n, k)} and ${b}^${m} leaves ${modpow(b, m, k)}, so the sum leaves (${modpow(a, n, k)} + ${modpow(b, m, k)}) mod ${k} = ${ans}. Trap: an off-by-one position inside the cycle.`,
      },
      (i) => String((ans + i + 1) % k),
    );
  },
  (r) => {
    const N = r.int(120, 999);
    const p = r.pick([2, 3, 5, 7]);
    let ans = 0;
    for (let q = p; q <= N; q *= p) ans += Math.floor(N / q);
    const label = p === 5 ? `How many zeros are there at the end of ${N}! (${N} factorial)?` : `What is the highest power of ${p} that divides ${N}! (${N} factorial)?`;
    return mcq(r, {
      prompt: label,
      correct: String(ans),
      distractors: [String(Math.floor(N / p)), String(Math.floor(N / p) + Math.floor(N / (p * p))), String(ans + 1), String(Math.floor(N / p) * 2)].filter((d) => d !== String(ans)),
      explanation: `Legendre's formula: add ⌊${N}/${p}⌋ + ⌊${N}/${p * p}⌋ + ⌊${N}/${p ** 3}⌋ + … = ${ans}. Trap: stopping after the first term (${Math.floor(N / p)}).`,
    });
  },
  (r) => {
    const { a, b, c, ra, rb, rc, ans } = attempt(r, () => {
      const [a, b, c] = r.shuffle([r.int(4, 9), r.int(10, 15), r.int(16, 21)]);
      const ra = r.int(1, a - 1);
      const rb = r.int(1, b - 1);
      const rc = r.int(1, c - 1);
      for (let x = 1; x <= lcm(lcm(a, b), c); x++) if (x % a === ra && x % b === rb && x % c === rc) return { a, b, c, ra, rb, rc, ans: x };
      return null;
    });
    const L = lcm(lcm(a, b), c);
    return mcq(r, {
      prompt: `What is the smallest positive number that leaves remainder ${ra} when divided by ${a}, ${rb} when divided by ${b} and ${rc} when divided by ${c}?`,
      correct: inr(ans),
      distractors: [inr(L + ra), inr(ans + L), inr(L), inr(Math.abs(L - ans) || ans + a)],
      explanation: `Solve the conditions one at a time: list numbers ≡ ${rc} (mod ${c}), keep those ≡ ${rb} (mod ${b}), then the first that is ≡ ${ra} (mod ${a}). The answer is ${ans}; every further solution is ${ans} + ${L}k, where ${L} = LCM(${a}, ${b}, ${c}).`,
    });
  },
];

// ── Time & work ─────────────────────────────────────────────────────────────
const workHard: Gen[] = [
  (r) => {
    const { x, y, k, T } = attempt(r, () => {
      const [x, y, k] = [r.int(6, 30), r.int(6, 30), r.int(2, 6)];
      const T = ((x + k) * y) / (x + y);
      return Number.isInteger(T) && T > k + 1 && x !== y ? { x, y, k, T } : null;
    });
    return mcq(r, {
      prompt: `A can finish a job in ${x} days and B in ${y} days. They start together, but A leaves ${k} days before the job is finished. How many days does the whole job take?`,
      correct: `${T} days`,
      distractors: [`${mixed(x * y, x + y)} days`, `${T + k} days`, `${T - k} days`, `${mixed(k * y + x * y, x + y + k)} days`],
      explanation: `If the job takes T days, A works T − ${k} days and B works T days: (T − ${k})/${x} + T/${y} = 1. So T(1/${x} + 1/${y}) = 1 + ${k}/${x}, giving T = ${T}.`,
    });
  },
  (r) => {
    const { x, y } = attempt(r, () => {
      const [x, y] = [r.int(5, 20), r.int(5, 20)];
      return x !== y ? { x, y } : null;
    });
    const W = lcm(x, y);
    const rates = [W / x, W / y];
    let left = W;
    let day = 0;
    let num = 0;
    let den = 1;
    for (;;) {
      const rate = rates[day % 2];
      if (left <= rate) {
        num = day * rate + left;
        den = rate;
        break;
      }
      left -= rate;
      day++;
    }
    return mcq(r, {
      prompt: `A alone can finish a job in ${x} days and B alone in ${y} days. They work on alternate days, starting with A. In how many days will the job be finished?`,
      correct: `${mixed(num, den)} days`,
      distractors: [`${mixed(x * y, x + y)} days`, `${mixed(2 * x * y, x + y)} days`, `${Math.ceil(num / den)} days`, `${mixed(num + den, den)} days`],
      explanation: `Take the job as ${W} units: A does ${rates[0]} units a day, B ${rates[1]}. Every 2 days they finish ${rates[0] + rates[1]} units. Run the days until the work left is less than a full day's share; the last part takes a fraction of a day. Total: ${mixed(num, den)} days.`,
    });
  },
  (r) => {
    const v = attempt(r, () => {
      const [m1, d1, h1, w1] = [r.int(4, 20), r.int(6, 24), r.int(6, 10), r.int(2, 6)];
      const [m2, h2, w2] = [r.int(4, 20), r.int(6, 10), r.int(2, 6)];
      const d2 = (m1 * d1 * h1 * w2) / (w1 * m2 * h2);
      return Number.isInteger(d2) && d2 > 1 && d2 !== d1 && m1 !== m2 && w1 !== w2 && h1 !== h2 ? { m1, d1, h1, w1, m2, h2, w2, d2 } : null;
    });
        return mcq(r, {
      prompt: `${v.m1} workers, working ${v.h1} hours a day, build ${v.w1} km of road in ${v.d1} days. How many days will ${v.m2} workers, working ${v.h2} hours a day, take to build ${v.w2} km of road?`,
      correct: `${v.d2} days`,
      distractors: [`${mixed(v.m1 * v.d1 * v.w2, v.w1 * v.m2)} days`, `${mixed(v.m1 * v.d1 * v.h1, v.m2 * v.h2)} days`, `${mixed(v.w1 * v.m2 * v.h2 * v.d1, v.m1 * v.h1 * v.w2)} days`, `${v.d2 + 1} days`],
      explanation: `Work ∝ workers × hours × days: (${v.m1} × ${v.h1} × ${v.d1}) / ${v.w1} = (${v.m2} × ${v.h2} × D) / ${v.w2}, so D = ${v.d2}.`,
    });
  },
];

// ── Speed, time & distance ──────────────────────────────────────────────────
const speedHard: Gen[] = [
  (r) => {
    const v = attempt(r, () => {
      const [w1, w2] = [r.int(2, 8), r.int(2, 8)];
      const sp = r.int(30, 90);
      const a = sp - w1;
      const b = sp + w2;
      const g = gcd(a, b);
      let [t1, t2] = [b / g, a / g];
      // Length (m) = t1 × a × 5/18 must be whole; scale the times until it is.
      for (let m = 1; m <= 18; m++) {
        if (((t1 * m * a * 5) % 18 === 0) && t1 * m <= 60 && t2 * m >= 4) {
          [t1, t2] = [t1 * m, t2 * m];
          return { w1, w2, sp, t1, t2, L: (t1 * a * 5) / 18 };
        }
      }
      return null;
    });
    return mcq(r, {
      prompt: `A train passes a man walking at ${v.w1} km/h in the same direction in ${v.t1} seconds, and a woman walking at ${v.w2} km/h towards it in ${v.t2} seconds. What is the speed of the train?`,
      correct: `${v.sp} km/h`,
      distractors: [`${v.sp - v.w1} km/h`, `${v.sp + v.w2} km/h`, `${Math.round((v.sp * 5) / 18)} km/h`, `${v.sp + v.w1} km/h`],
      explanation: `Both times cover the train's own length L. Same direction: L = (S − ${v.w1}) × 5/18 × ${v.t1}. Opposite: L = (S + ${v.w2}) × 5/18 × ${v.t2}. So ${v.t1}(S − ${v.w1}) = ${v.t2}(S + ${v.w2}), giving S = ${v.sp} km/h (and L = ${v.L} m).`,
    });
  },
  (r) => {
    const v = attempt(r, () => {
      const L = r.pick([300, 360, 400, 480, 600, 720, 800, 1200]);
      const [a, b] = [r.int(2, 12), r.int(2, 12)];
      if (a <= b || L % a || L % b) return null;
      return { L, a, b, ans: lcm(L / a, L / b) };
    });
    return mcq(r, {
      prompt: `Two runners start together from the same point on a circular track of length ${v.L} m and run in the same direction at ${v.a} m/s and ${v.b} m/s. After how many seconds will they first be together again at the starting point?`,
      correct: `${inr(v.ans)} seconds`,
      distractors: [`${mixed(v.L, v.a - v.b)} seconds`, `${mixed(v.L, v.a + v.b)} seconds`, `${inr((v.L / v.a) * (v.L / v.b))} seconds`, `${inr(v.ans * 2)} seconds`],
      explanation: `One lap takes ${v.L / v.a} s and ${v.L / v.b} s. Both are back at the start together after LCM(${v.L / v.a}, ${v.L / v.b}) = ${v.ans} s. Trap: ${mixed(v.L, v.a - v.b)} s is when they first meet anywhere on the track.`,
    });
  },
  (r) => {
    const v = attempt(r, () => {
      const [a, b, c] = [r.int(2, 18) * 5, r.int(2, 18) * 5, r.int(2, 18) * 5];
      if (new Set([a, b, c]).size < 3) return null;
      const num = 3 * a * b * c;
      const den = a * b + b * c + a * c;
      return num % den === 0 ? { a, b, c, ans: num / den } : null;
    });
    return mcq(r, {
      prompt: `A car covers three equal stretches of a road at ${v.a} km/h, ${v.b} km/h and ${v.c} km/h. What is its average speed for the whole journey?`,
      correct: `${v.ans} km/h`,
      distractors: [`${mixed(v.a + v.b + v.c, 3)} km/h`, `${mixed(2 * v.a * v.b, v.a + v.b)} km/h`, `${v.ans + 5} km/h`, `${mixed(v.a + v.c, 2)} km/h`],
      explanation: `Average speed = total distance ÷ total time = 3d ÷ (d/${v.a} + d/${v.b} + d/${v.c}) = ${v.ans} km/h. Trap: the plain average of the speeds, ${mixed(v.a + v.b + v.c, 3)}.`,
    });
  },
];

// ── Percentages ─────────────────────────────────────────────────────────────
const percentHard: Gen[] = [
  (r) => {
    const v = attempt(r, () => {
      const [x, y, z] = [r.pick([10, 20, 25, 30, 40]), r.pick([10, 20, 25, 40, 50]), r.pick([10, 20, 25, 50])];
      const I = r.int(2, 12) * 5000;
      const S = (I * (100 - x) * (100 - y) * (100 - z)) / 1e6;
      return Number.isInteger(S) && x + y + z < 100 ? { x, y, z, I, S } : null;
    });
    const additive = Math.round(v.S / (1 - (v.x + v.y + v.z) / 100));
    return mcq(r, {
      prompt: `A man spends ${v.x}% of his monthly income on rent, ${v.y}% of the remaining on food and ${v.z}% of what is then left on travel. He saves the rest, which is ${rupees(v.S)}. What is his monthly income?`,
      correct: rupees(v.I),
      distractors: [rupees(additive), rupees(Math.round(v.S * (1 + v.x / 100) * (1 + v.y / 100) * (1 + v.z / 100))), rupees(v.I + 5000), rupees(Math.round(v.S / (1 - v.x / 100)))],
      explanation: `Savings = I × ${(100 - v.x) / 100} × ${(100 - v.y) / 100} × ${(100 - v.z) / 100} = ${rupees(v.S)}, so I = ${rupees(v.I)}. Trap: subtracting ${v.x}% + ${v.y}% + ${v.z}% from the whole income.`,
    });
  },
  (r) => {
    const v = attempt(r, () => {
      const [x, y, z] = [r.pick([10, 15, 20, 25]), r.pick([5, 10, 20]), r.int(52, 70)];
      const V = r.int(2, 40) * 1000;
      const valid = (V * (100 - x) * (100 - y)) / 10000;
      const margin = (valid * (2 * z - 100)) / 100;
      return Number.isInteger(valid) && Number.isInteger(margin) && margin > 0 ? { x, y, z, V, valid, margin } : null;
    });
    return mcq(r, {
      prompt: `In an election between two candidates, ${v.x}% of the voters did not vote and ${v.y}% of the votes cast were invalid. The winner got ${v.z}% of the valid votes and won by ${inr(v.margin)} votes. How many voters were on the list?`,
      correct: inr(v.V),
      distractors: [
        inr(Math.round((v.margin * 100) / (2 * v.z - 100) / ((100 - v.x) / 100))),
        inr(Math.round((v.margin * 100) / (2 * v.z - 100))),
        inr(Math.round((v.margin * 100) / (v.z - 50) / ((100 - v.x) * (100 - v.y) / 10000))),
        inr(v.V + 1000),
      ],
      explanation: `Valid votes = V × ${(100 - v.x) / 100} × ${(100 - v.y) / 100}. The margin is (${v.z}% − ${100 - v.z}%) = ${2 * v.z - 100}% of the valid votes = ${inr(v.margin)}, so valid votes = ${inr(v.valid)} and V = ${inr(v.V)}.`,
    });
  },
];

// ── Data sufficiency (two-digit number) ─────────────────────────────────────
type Pred = { text: string; test: (n: number) => boolean };
const tens = (n: number) => Math.floor(n / 10);
const units = (n: number) => n % 10;
const isPrime = (n: number) => n > 1 && range(2, Math.floor(Math.sqrt(n))).every((d) => n % d);
function predicatesFor(N: number, r: Rng): Pred[] {
  const [t, u] = [tens(N), units(N)];
  const out: Pred[] = [
    { text: `The sum of its digits is ${t + u}.`, test: (n) => tens(n) + units(n) === t + u },
    { text: `The product of its digits is ${t * u}.`, test: (n) => tens(n) * units(n) === t * u },
    t === u
      ? { text: "Its two digits are equal.", test: (n) => tens(n) === units(n) }
      : t > u
        ? { text: `Its tens digit is ${t - u} more than its units digit.`, test: (n) => tens(n) - units(n) === t - u }
        : { text: `Its units digit is ${u - t} more than its tens digit.`, test: (n) => units(n) - tens(n) === u - t },
  ];
  const lo = Math.max(9, N - r.int(3, 12));
  const hi = Math.min(100, N + r.int(3, 12));
  out.push({ text: `It lies between ${lo} and ${hi}.`, test: (n) => n > lo && n < hi });
  const divs = range(3, 12).filter((k) => N % k === 0);
  if (divs.length) {
    const k = r.pick(divs);
    out.push({ text: `It is divisible by ${k}.`, test: (n) => n % k === 0 });
  }
  if (isPrime(N)) out.push({ text: "It is a prime number.", test: isPrime });
  return out;
}
const dsHard: Gen[] = [
  (r) => {
    const all = range(10, 99);
    const v = attempt(r, () => {
      const N = r.int(10, 99);
      const preds = r.shuffle(predicatesFor(N, r)).slice(0, 2);
      const askDiv = r.next() < 0.4 ? r.int(3, 9) : 0;
      const [s1, s2] = preds;
      const c1 = all.filter(s1.test);
      const c2 = all.filter(s2.test);
      const both = all.filter((n) => s1.test(n) && s2.test(n));
      const decides = (c: number[]) => (askDiv ? new Set(c.map((n) => n % askDiv === 0)).size === 1 : c.length === 1);
      const [a1, a2, ab] = [decides(c1), decides(c2), decides(both)];
      const answer = a1 && a2 ? 3 : a1 ? 0 : a2 ? 1 : ab ? 2 : 4;
      return { N, s1, s2, askDiv, c1, c2, both, answer };
    });
    const q = v.askDiv ? `N is a two-digit number. Is N divisible by ${v.askDiv}?` : "N is a two-digit number. What is N?";
    const show = (c: number[]) => (c.length <= 6 ? c.join(", ") : `${c.slice(0, 5).join(", ")} … (${c.length} numbers)`);
    return {
      kind: "mcq",
      prompt: `${q}\nI. ${v.s1.text}\nII. ${v.s2.text}\nWhich statement(s) are sufficient to answer the question?`,
      options: DS_OPTIONS,
      answer: v.answer,
      explanation: `Statement I allows: ${show(v.c1)}. Statement II allows: ${show(v.c2)}. Together: ${show(v.both)}. ${
        v.askDiv ? `A statement is sufficient only if every number it allows gives the same yes/no answer.` : `A statement is sufficient only if it leaves exactly one number.`
      } So: ${DS_OPTIONS[v.answer]}.`,
    };
  },
];

// ── Clocks ──────────────────────────────────────────────────────────────────
/** Times (in 1/11 minute units) after H o'clock, within the hour, when the hands make angle θ. */
function clockTimes(H: number, theta: number): number[] {
  const out = new Set<number>();
  // 5.5 t = 30H ± θ + 360k  →  t = (60H ± 2θ + 720k)/11 minutes = (60H ± 2θ + 720k) elevenths.
  for (const s of [1, -1]) for (const k of [-1, 0, 1]) {
    const elevenths = 60 * H + s * 2 * theta + 720 * k;
    if (elevenths >= 0 && elevenths < 660) out.add(elevenths);
  }
  return [...out].sort((a, b) => a - b);
}
const clockLabel = (H: number, e: number) => {
  const whole = Math.floor(e / 11);
  const rem = e % 11;
  return `${H}:${String(whole).padStart(2, "0")}${rem ? ` ${rem}/11` : ""}`;
};
const clockHard: Gen[] = [
  (r) => {
    const v = attempt(r, () => {
      const H = r.int(1, 11);
      const [theta, word] = r.pick([[0, "together (coincide)"], [180, "exactly opposite each other"], [90, "at right angles"]] as const);
      const times = clockTimes(H, theta);
      if (!times.length) return null;
      const which = times.length > 1 && r.next() < 0.5 ? 1 : 0;
      return { H, theta, word, times, which };
    });
    const ans = v.times[v.which];
    const others = [0, 90, 180].filter((x) => x !== v.theta).flatMap((x) => clockTimes(v.H, x));
    const nth = v.times.length > 1 ? (v.which ? "the second time" : "the first time") : "the time";
    return mcq(r, {
      prompt: `Between ${v.H} and ${v.H + 1} o'clock, at what time are the hands of a clock ${v.word}? (Give ${nth}.)`,
      correct: clockLabel(v.H, ans),
      distractors: [...v.times.filter((t) => t !== ans), ...others, Math.round(ans / 11) * 11 === ans ? (ans + 11 < 660 ? ans + 11 : ans - 11) : Math.min(Math.round(ans / 11) * 11, 649)].map((t) => clockLabel(v.H, t)),
      explanation: `The minute hand gains 5.5° a minute on the hour hand. At ${v.H}:00 the gap is ${30 * v.H}°. The hands are ${v.theta}° apart when 5.5t = ${30 * v.H} ± ${v.theta} (± 360), i.e. t = ${(ans / 11).toFixed(2)} min → ${clockLabel(v.H, ans)}.`,
    });
  },
  (r) => {
    const v = attempt(r, () => {
      const g = r.int(2, 20);
      const shown = r.int(6, 18); // hours the faulty clock shows as passed
      const trueMin = (shown * 60 * 60) / (60 + g);
      return Number.isInteger(trueMin) && trueMin % 1 === 0 ? { g, shown, trueMin } : null;
    });
    const start = r.int(6, 9);
    const fmtTime = (mins: number) => {
      const total = (start * 60 + mins) % (24 * 60);
      const h = Math.floor(total / 60);
      const m = total % 60;
      return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
    };
    const naive = v.shown * 60 - v.g * v.shown;
    return mcq(r, {
      prompt: `A clock gains ${v.g} minutes every hour. It is set right at ${start}:00 AM. What is the correct time when this clock shows ${fmtTime(v.shown * 60)}?`,
      correct: fmtTime(v.trueMin),
      distractors: [fmtTime(naive), fmtTime(v.shown * 60 + v.g * v.shown), fmtTime(v.trueMin + 60), fmtTime(v.trueMin - v.g)],
      explanation: `For every 60 true minutes the clock moves ${60 + v.g}. It showed ${v.shown * 60} minutes passing, so the true time passed is ${v.shown * 60} × 60/${60 + v.g} = ${v.trueMin} minutes → ${fmtTime(v.trueMin)}. Trap: subtracting ${v.g} min × ${v.shown} h = ${v.g * v.shown} min, which uses the clock's hours instead of real hours.`,
    });
  },
];

// ── Calendars ───────────────────────────────────────────────────────────────
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const weekday = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).getUTCDay();
const ORD = ["first", "second", "third", "fourth"];
const nth = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;
const calendarHard: Gen[] = [
  (r) => {
    const Y = r.int(1990, 2035);
    let ans = Y + 1;
    while (!(weekday(ans, 0, 1) === weekday(Y, 0, 1) && isLeap(ans) === isLeap(Y))) ans++;
    return mcq(r, {
      prompt: `The calendar for the year ${Y} will be repeated exactly (same dates on the same days) for the first time in which year?`,
      correct: String(ans),
      distractors: [Y + 6, Y + 11, Y + 28, Y + 5, Y + 7].filter((x) => x !== ans).map(String),
      explanation: `A year's calendar repeats when a later year starts on the same day of the week and is ${isLeap(Y) ? "also" : "also not"} a leap year. Add up the odd days (1 for an ordinary year, 2 for a leap year) from ${Y}: the total first becomes a multiple of 7 at ${ans}${isLeap(Y) ? "" : `, and ${ans} has the same leap-year status`}.`,
    });
  },
  (r) => {
    const y = r.int(2025, 2030);
    const m = r.int(0, 11);
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const w1 = r.int(0, 6);
    const k = r.int(1, 3);
    const first = range(1, 7).find((d) => weekday(y, m, d) === w1)!;
    const given = first + 7 * (k - 1);
    const w2 = r.pick(range(0, 6).filter((w) => w !== w1));
    const last = range(1, days).filter((d) => weekday(y, m, d) === w2).at(-1)!;
    return mcq(r, {
      prompt: `In a month of ${days} days (${MONTHS[m]}), the ${ORD[k - 1]} ${DAYS[w1]} falls on the ${nth(given)}. On which date does the last ${DAYS[w2]} of that month fall?`,
      correct: `${last}`,
      distractors: [last - 7, last + 1 <= days ? last + 1 : last - 8, last - 1, last - 14].filter((d) => d > 0).map(String),
      explanation: `The ${ORD[k - 1]} ${DAYS[w1]} is the ${nth(given)}, so ${DAYS[w1]}s fall on ${first}, ${first + 7}, ${first + 14}, … . Count forward to the ${DAYS[w2]}s and keep the last one that is ≤ ${days}: the ${nth(last)}.`,
    });
  },
];

// ── Number series: find the wrong term ──────────────────────────────────────
const seriesHard: Gen[] = [
  (r) => {
    const v = attempt(r, () => {
      const kind = r.int(0, 3);
      const terms: number[] = [];
      let rule = "";
      if (kind === 0) {
        const [a, k, c] = [r.int(2, 9), r.int(2, 3), r.int(-3, 5)];
        terms.push(a);
        while (terms.length < 7) terms.push(terms.at(-1)! * k + c);
        rule = `each term = previous × ${k} ${c < 0 ? "−" : "+"} ${Math.abs(c)}`;
      } else if (kind === 1) {
        const [a, d0, dd] = [r.int(2, 20), r.int(1, 6), r.int(2, 5)];
        terms.push(a);
        for (let i = 0; terms.length < 7; i++) terms.push(terms.at(-1)! + d0 + i * dd);
        rule = `the differences increase by ${dd} each time`;
      } else if (kind === 2) {
        const [s, c] = [r.int(1, 4), r.int(-2, 3)];
        for (let n = s; terms.length < 7; n++) terms.push(n ** 3 + c);
        rule = `the terms are n³ ${c < 0 ? "−" : "+"} ${Math.abs(c)} for n = ${s}, ${s + 1}, …`;
      } else {
        const [a, k, c] = [r.int(2, 9), r.int(2, 3), r.int(1, 6)];
        terms.push(a);
        while (terms.length < 7) terms.push(terms.length % 2 ? terms.at(-1)! * k : terms.at(-1)! + c);
        rule = `the operations alternate: × ${k}, then + ${c}`;
      }
      if (terms.some((t, i) => t <= 0 || t > 5000 || (i > 0 && t <= terms[i - 1]))) return null; // strictly increasing, no degenerate runs
      const bad = r.int(2, 5);
      const delta = r.pick([-2, -1, 1, 2, 3]);
      const shown = terms.map((t, i) => (i === bad ? t + delta : t));
      return { terms, shown, bad, rule };
    });
    const wrong = v.shown[v.bad];
    return mcq(r, {
      prompt: `Find the wrong number in the series:\n${v.shown.join(", ")}`,
      correct: String(wrong),
      distractors: r.shuffle(v.shown.filter((_, i) => i !== v.bad && i > 0)).map(String),
      explanation: `Rule: ${v.rule}. The series should be ${v.terms.join(", ")}, so ${wrong} should be ${v.terms[v.bad]}. Trap: the wrong term also breaks the step after it, so check every step, not just the first mismatch.`,
    });
  },
];

// ── Pseudocode ──────────────────────────────────────────────────────────────
type Built = { code: string; ans: string; alts: string[]; why: string };
const pseudo = (b: (r: Rng) => Built): Gen => (r) => {
  const x = b(r);
  return mcq(r, { prompt: "What will be the output of the following pseudocode?", code: x.code, correct: x.ans, distractors: x.alts, explanation: x.why });
};

const recursionHard: Gen[] = [
  pseudo((r) => {
    const v = attempt(r, () => {
      const [A, B, N] = [r.int(1, 2), r.int(1, 3), r.int(3, 6)];
      const order = (n: number, mode: "in" | "pre" | "post", out: number[] = []): number[] => {
        if (n > 0) {
          if (mode === "pre") out.push(n);
          order(n - A, mode, out);
          if (mode === "in") out.push(n);
          order(n - B, mode, out);
          if (mode === "post") out.push(n);
        }
        return out;
      };
      const ins = order(N, "in");
      return ins.length >= 4 && ins.length <= 10 ? { A, B, N, ins, pre: order(N, "pre"), post: order(N, "post") } : null;
    });
    return {
      code: `function fun(Integer n)
    if (n > 0)
        fun(n - ${v.A})
        Print n
        fun(n - ${v.B})
    end if
End function fun()

fun(${v.N})`,
      ans: v.ins.join(" "),
      alts: [v.pre.join(" "), v.post.join(" "), [...v.ins].reverse().join(" ")],
      why: `Print sits between the two calls, so for each n: everything printed by fun(n − ${v.A}) comes first, then n, then everything printed by fun(n − ${v.B}). Expanding from fun(${v.N}) gives ${v.ins.join(" ")}. Traps: printing before the calls gives ${v.pre.join(" ")}; after both gives ${v.post.join(" ")}.`,
    };
  }),
  pseudo((r) => {
    const v = attempt(r, () => {
      const [b, d, N] = [r.int(1, 3), r.int(2, 4), r.int(12, 40)];
      const f = (n: number, half = (x: number) => Math.floor(x / 2), lim = b): number => (n <= lim ? n + 1 : f(half(n), half, lim) + f(n - d, half, lim));
      const ans = f(N);
      return ans < 5000 ? { b, d, N, ans, ceil: f(N, (x) => Math.ceil(x / 2)), base: f(N, undefined, b + 1), prev: f(N - 1) } : null;
    });
    return {
      code: `Integer fun(Integer n)
    if (n <= ${v.b})
        return n + 1
    end if
    return fun(n / 2) + fun(n - ${v.d})
End function fun()

Print fun(${v.N})`,
      ans: String(v.ans),
      alts: [String(v.ceil), String(v.base), String(v.prev)],
      why: `Two calls per level make a call tree; memoise values bottom-up (n / 2 is integer division). fun(${v.N}) = ${v.ans}. Traps: rounding n / 2 up gives ${v.ceil}; stopping one step later (n <= ${v.b + 1}) gives ${v.base}.`,
    };
  }),
];

const loopsHard: Gen[] = [
  pseudo((r) => {
    const [N, cMod, dMod] = [r.int(5, 8), r.int(3, 4), r.int(4, 6)];
    const run = (brk: "inner" | "none" | "outer", skip: boolean, n = N) => {
      let s = 0;
      outer: for (let i = 1; i <= n; i++) {
        if (skip && i % cMod === 0) continue;
        for (let j = 1; j <= i; j++) {
          if ((i + j) % dMod === 0) {
            if (brk === "inner") break;
            if (brk === "outer") break outer;
          }
          s = s + (i & j) + Math.floor(j / 2);
        }
      }
      return s;
    };
    return {
      code: `Integer s, i, j
Set s = 0
for (i = 1 to ${N})
    if (i mod ${cMod} == 0)
        continue
    end if
    for (j = 1 to i)
        if ((i + j) mod ${dMod} == 0)
            break
        end if
        s = s + (i & j) + j / 2
    end for
end for
Print s`,
      ans: String(run("inner", true)),
      alts: [String(run("none", true)), String(run("inner", false)), String(run("outer", true)), String(run("inner", true, N - 1))],
      why: `continue skips every i that is a multiple of ${cMod}; break leaves only the inner loop; & is bitwise AND and j / 2 is integer division. Tracing gives s = ${run("inner", true)}. Traps: ignoring break → ${run("none", true)}; ignoring continue → ${run("inner", false)}; break leaving both loops → ${run("outer", true)}.`,
    };
  }),
];

const bitwiseHard: Gen[] = [
  pseudo((r) => {
    const [A, B] = [r.int(5, 40), r.int(5, 30)];
    const useXor = r.next() < 0.5;
    const run = (xor: boolean) => {
      let [a, b, c] = [A, B, 0];
      while (b > 0) {
        if (b & 1) c = xor ? c ^ a : c + a;
        a = a << 1;
        b = b >> 1;
      }
      return c;
    };
    const ans = run(useXor);
    return {
      code: `Integer a, b, c
Set a = ${A}, b = ${B}, c = 0
while (b > 0)
    if (b & 1)
        c = c ${useXor ? "^" : "+"} a
    end if
    a = a << 1
    b = b >> 1
end while
Print c`,
      ans: String(ans),
      alts: [String(run(!useXor)), String(A + B), String(A ^ B), String(ans + A)],
      why: useXor
        ? `Each set bit of b XORs a shifted copy of a into c (no carries), so this is not ordinary multiplication: c = ${ans}. Trap: ${A} × ${B} = ${A * B}.`
        : `Each set bit of b adds a shifted copy of a into c: this is binary multiplication, so c = ${A} × ${B} = ${ans}.`,
    };
  }),
  pseudo((r) => {
    const X = r.int(100, 2000);
    const s = r.int(1, 3);
    const pop = X.toString(2).split("").filter((b) => b === "1").length;
    const ans = pop + (X >> s);
    return {
      code: `Integer x, c
Set x = ${X}, c = 0
while (x != 0)
    x = x & (x - 1)
    c = c + 1
end while
Print c + (${X} >> ${s})`,
      ans: String(ans),
      alts: [String(X.toString(2).length + (X >> s)), String(pop + (X << s)), String(pop + Math.floor(X / s)), String(pop - 1 + (X >> s))],
      why: `x & (x − 1) clears the lowest set bit, so the loop counts the 1-bits of ${X} (binary ${X.toString(2)}): c = ${pop}. ${X} >> ${s} = ⌊${X}/${2 ** s}⌋ = ${X >> s}. Total ${ans}.`,
    };
  }),
];

/** Hard-tier generator per topic id. Topics without an entry only have standard questions. */
export const HARD: Record<string, (seed: number) => Question> = {
  "m-prob": fromHard(probHard),
  "m-pnc": fromHard(pncHard),
  "m-number": fromHard(numberHard),
  "m-timework": fromHard(workHard),
  "m-speed": fromHard(speedHard),
  "m-percent": fromHard(percentHard),
  "r-ds": fromHard(dsHard),
  "r-clock": fromHard(clockHard),
  "r-calendar": fromHard(calendarHard),
  "r-series": fromHard(seriesHard),
  "p-recursion": fromHard(recursionHard),
  "p-loops": fromHard(loopsHard),
  "p-bitwise": fromHard(bitwiseHard),
};
