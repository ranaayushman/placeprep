/**
 * Extra standard-tier question types for topics that had only one template (direction, clocks,
 * calendars, odd one out, averages, boats, functions). Mixed in by seed, so practice and mocks vary.
 * Answers are computed; nothing is typed in.
 */
import { DAYS, MONTHS } from "./reasoning";
import { REASONING_VARIETY } from "./reasoning-more";
import { mcq, rng, type Rng } from "./rng";
import type { Question } from "./types";

type Gen = (r: Rng) => Question;
const NAMES = ["Ravi", "Meera", "Arjun", "Sana", "Kabir", "Isha", "Rohan", "Anu"];
const COMPASS8 = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];

/** A topic's generator: the original template keeps an equal share with each extra template. */
export function mixWith(base: (seed: number) => Question, extras: Gen[]) {
  return (seed: number) => {
    const r = rng((seed ^ 0x68e31da4) >>> 0);
    const k = r.int(0, extras.length);
    return k === extras.length ? base(seed) : extras[k](r);
  };
}

// ── Direction sense ─────────────────────────────────────────────────────────
const directionExtras: Gen[] = [
  (r) => {
    const start = r.int(0, 3) * 2;
    const turns = Array.from({ length: r.int(3, 4) }, () => ({ deg: r.pick([45, 90, 135, 180]), cw: r.next() < 0.5 }));
    const end = turns.reduce((d, t) => (d + (t.cw ? 1 : -1) * (t.deg / 45) + 8) % 8, start);
    const allCw = turns.reduce((d, t) => (d + t.deg / 45) % 8, start);
    const name = r.pick(NAMES);
    return mcq(r, {
      prompt: `${name} is facing ${COMPASS8[start]}. ${name} turns ${turns.map((t) => `${t.deg}° ${t.cw ? "clockwise" : "anticlockwise"}`).join(", then ")}. Which direction is ${name} facing now?`,
      correct: COMPASS8[end],
      distractors: [COMPASS8[allCw], COMPASS8[(end + 4) % 8], COMPASS8[(16 - end) % 8], COMPASS8[(end + 2) % 8]],
      explanation: `Count in 45° steps (clockwise +, anticlockwise −): ${turns.map((t) => `${t.cw ? "+" : "−"}${t.deg / 45}`).join(" ")} = net ${((end - start + 8) % 8) * 45}° clockwise from ${COMPASS8[start]} → ${COMPASS8[end]}.`,
    });
  },
  (r) => {
    const morning = r.next() < 0.5;
    const rel = r.pick(["right", "left", "behind", "in front of"] as const);
    const shadow = morning ? 3 : 1; // N=0, E=1, S=2, W=3: shadows point away from the sun
    const offset = { "in front of": 0, right: 1, behind: 2, left: 3 }[rel];
    const facing = (shadow - offset + 4) % 4;
    const D4 = ["North", "East", "South", "West"];
    const name = r.pick(NAMES);
    return mcq(r, {
      prompt: `One ${morning ? "morning, just after sunrise" : "evening, just before sunset"}, ${name} was standing near a pole. The pole's shadow fell exactly ${rel === "in front of" ? "in front of" : rel === "behind" ? "behind" : `to the ${rel} of`} ${name}. Which direction was ${name} facing?`,
      correct: D4[facing],
      distractors: [D4[(facing + 2) % 4], D4[(facing + 1) % 4], D4[(facing + 3) % 4]],
      explanation: `The sun rises in the east and sets in the west, so in the ${morning ? "morning shadows point West" : "evening shadows point East"}. The shadow is ${rel === "in front of" ? "in front of" : rel === "behind" ? "behind" : `on the ${rel} of`} ${name}, so ${name} faces ${D4[facing]}.`,
    });
  },
  (r) => {
    for (;;) {
      const legs = Array.from({ length: r.int(4, 5) }, () => r.int(2, 12));
      const turns = legs.slice(1).map(() => (r.next() < 0.5 ? "left" : "right"));
      let [x, y, d] = [0, 0, 0]; // d: 0=N,1=E,2=S,3=W
      legs.forEach((len, i) => {
        if (i > 0) d = (d + (turns[i - 1] === "right" ? 1 : 3)) % 4;
        x += [0, 1, 0, -1][d] * len;
        y += [1, 0, -1, 0][d] * len;
      });
      const dist = Math.sqrt(x * x + y * y);
      if (!Number.isInteger(dist) || dist === 0 || x === 0 || y === 0) continue;
      const dir = `${y > 0 ? "North" : "South"}-${x > 0 ? "East" : "West"}`;
      const mirror = `${y > 0 ? "North" : "South"}-${x > 0 ? "West" : "East"}`;
      const name = r.pick(NAMES);
      return mcq(r, {
        prompt: `${name} walks ${legs[0]} m north, ${legs.slice(1).map((l, i) => `turns ${turns[i]} and walks ${l} m`).join(", then ")}. How far and in which direction is ${name} from the starting point?`,
        correct: `${dist} m, ${dir}`,
        distractors: [`${dist} m, ${mirror}`, `${legs.reduce((a, b) => a + b, 0)} m, ${dir}`, `${Math.abs(x) + Math.abs(y)} m, ${dir}`, `${dist} m, ${y > 0 ? "South" : "North"}-${x > 0 ? "East" : "West"}`],
        explanation: `Track the facing after each turn and add up the moves: net ${Math.abs(x)} m ${x > 0 ? "east" : "west"} and ${Math.abs(y)} m ${y > 0 ? "north" : "south"}. Distance = √(${Math.abs(x)}² + ${Math.abs(y)}²) = ${dist} m, towards the ${dir}. Trap: "left" and "right" depend on which way you are facing at that moment.`,
      });
    }
  },
];

// ── Clocks ──────────────────────────────────────────────────────────────────
const clockExtras: Gen[] = [
  (r) => {
    const h = r.int(1, 12);
    const m = r.int(1, 59);
    const total = (720 - (h % 12) * 60 - m + 720) % 720;
    const fmt = (mins: number) => `${Math.floor(mins / 60) || 12}:${String(mins % 60).padStart(2, "0")}`;
    const shown = `${h}:${String(m).padStart(2, "0")}`;
    return mcq(r, {
      prompt: `The mirror image of a clock (mirror held vertically) shows ${shown}. What is the actual time?`,
      correct: fmt(total),
      distractors: [fmt((total + 60) % 720), fmt((780 - (h % 12) * 60 - m + 720) % 720 === total ? (total + 30) % 720 : (780 - (h % 12) * 60 - m + 720) % 720), `${String(m).padStart(2, "0").replace(/^0/, "") || 12}:${String(h).padStart(2, "0")}`, fmt((total + 659) % 720)],
      explanation: `For a vertical mirror, actual time = 11:60 − shown time (use 23:60 if needed). 11:60 − ${shown} = ${fmt(total)}.`,
    });
  },
  (r) => {
    const [theta, word] = r.pick([[0, "coincide"], [180, "point in opposite directions"], [90, "are at right angles"]] as const);
    const from = r.int(0, 11);
    const span = r.pick([3, 4, 5, 6, 12, 24]);
    // Event times in minutes from 12:00: 5.5t ≡ ±θ (mod 360) → t = (360k ± θ)/5.5.
    const times = new Set<number>();
    for (let k = -2; k <= 60; k++) for (const s of [1, -1]) {
      const t = (360 * k + s * theta) / 5.5;
      if (t >= from * 60 - 1e-9 && t < (from + span) * 60 - 1e-9) times.add(Math.round(t * 1000));
    }
    const n = times.size;
    const naive = theta === 90 ? span * 2 : span;
    const at = (h: number) => `${h % 12 || 12} ${h % 24 < 12 ? "AM" : "PM"}`;
    return mcq(r, {
      prompt: `How many times do the hands of a clock ${word} between ${at(from)} and ${at(from + span)}${span >= 12 ? ` (${span} hours)` : ""}? (Count a moment exactly at the start, but not at the end.)`,
      correct: String(n),
      distractors: [String(naive), String(n + 1), String(Math.max(0, n - 1)), String(n + 2)],
      explanation: `The minute hand gains 360° on the hour hand every 12/11 hours, so each angle repeats every 65 5/11 minutes (right angles happen twice in each cycle). Listing the times from ${at(from)} gives ${n}. Trap: assuming exactly ${theta === 90 ? "2 per hour" : "1 per hour"}.`,
    });
  },
];

// ── Calendars ───────────────────────────────────────────────────────────────
const wd = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).getUTCDay();
const calendarExtras: Gen[] = [
  (r) => {
    const [y1, gap] = [r.int(2001, 2026), r.int(2, 7)];
    const [m, d] = [r.int(0, 11), r.int(1, 28)];
    const y2 = y1 + gap;
    const ans = wd(y2, m, d);
    const leapDays = Math.round((Date.UTC(y2, m, d) - Date.UTC(y1, m, d)) / 86400000) - 365 * gap;
    return mcq(r, {
      prompt: `${d} ${MONTHS[m]} ${y1} was a ${DAYS[wd(y1, m, d)]}. What day of the week was ${d} ${MONTHS[m]} ${y2}?`,
      correct: DAYS[ans],
      distractors: [DAYS[(wd(y1, m, d) + gap) % 7], DAYS[(ans + 1) % 7], DAYS[(ans + 6) % 7], DAYS[(ans + 2) % 7]],
      explanation: `Each year moves the day forward by 1, plus 1 more for every 29 February crossed. ${gap} years + ${leapDays} leap day(s) = ${gap + leapDays} odd days → ${DAYS[ans]}. Trap: forgetting the leap day(s) gives ${DAYS[(wd(y1, m, d) + gap) % 7]}.`,
    });
  },
  (r) => {
    const y = r.int(1990, 2035);
    const target = r.int(0, 6);
    let n = 0;
    for (let t = Date.UTC(y, 0, 1); t < Date.UTC(y + 1, 0, 1); t += 86400000) if (new Date(t).getUTCDay() === target) n++;
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return mcq(r, {
      prompt: `How many ${DAYS[target]}s are there in the year ${y}?`,
      correct: String(n),
      distractors: [String(n === 53 ? 52 : 53), "54", "51"],
      explanation: `${y} has ${leap ? 366 : 365} days = 52 weeks + ${leap ? 2 : 1} day${leap ? "s" : ""}. The extra day${leap ? "s are" : " is"} ${leap ? `${DAYS[wd(y, 0, 1)]} and ${DAYS[(wd(y, 0, 1) + 1) % 7]}` : DAYS[wd(y, 0, 1)]} (the first day${leap ? "s" : ""} of the year), so ${DAYS[target]} occurs ${n} times.`,
    });
  },
  (r) => {
    const y = r.int(2025, 2032);
    const m = r.int(0, 11);
    const target = r.int(0, 6);
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    let n = 0;
    for (let d = 1; d <= days; d++) if (wd(y, m, d) === target) n++;
    return mcq(r, {
      prompt: `${MONTHS[m]} ${y} begins on a ${DAYS[wd(y, m, 1)]}. How many ${DAYS[target]}s are there in that month?`,
      correct: String(n),
      distractors: [String(n === 5 ? 4 : 5), "3", "6"],
      explanation: `${MONTHS[m]} ${y} has ${days} days = 4 weeks + ${days - 28} day(s), and those extra days are the first ${days - 28} weekdays starting from ${DAYS[wd(y, m, 1)]}. ${DAYS[target]} ${n === 5 ? "is" : "is not"} among them, so it occurs ${n} times.`,
    });
  },
];

// ── Odd one out ─────────────────────────────────────────────────────────────
const oddExtras: Gen[] = [
  (r) => {
    const gap = r.int(1, 4);
    const groups = new Set<string>();
    while (groups.size < 3) {
      const s = r.int(0, 25 - 2 * gap);
      groups.add([0, 1, 2].map((i) => String.fromCharCode(65 + s + i * gap)).join(""));
    }
    let odd = "";
    while (!odd) {
      const g2 = r.pick([1, 2, 3, 4, 5].filter((x) => x !== gap));
      const s = r.int(0, 25 - 2 * g2);
      const cand = [0, 1, 2].map((i) => String.fromCharCode(65 + s + i * g2)).join("");
      if (!groups.has(cand)) odd = cand;
    }
    return mcq(r, {
      prompt: "Find the odd one out:",
      correct: odd,
      distractors: [...groups],
      explanation: `In ${[...groups].join(", ")} the letters are ${gap} place${gap > 1 ? "s" : ""} apart (skip ${gap - 1}). ${odd} has a different gap.`,
    });
  },
  (r) => {
    const rules = [
      { name: "the second number is the square of the first", f: (x: number) => x * x },
      { name: "the second number is the cube of the first", f: (x: number) => x ** 3 },
      { name: "the second number is the square of the first, plus 1", f: (x: number) => x * x + 1 },
      { name: "the second number is twice the first, plus 3", f: (x: number) => 2 * x + 3 },
    ];
    const rule = r.pick(rules);
    const xs = r.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 11, 12]).slice(0, 4);
    const pairs = xs.map((x) => `${x} : ${rule.f(x)}`);
    const k = r.int(0, 3);
    const off = r.pick([-2, -1, 1, 2]);
    pairs[k] = `${xs[k]} : ${rule.f(xs[k]) + off}`;
    return mcq(r, {
      prompt: "Find the odd pair:",
      correct: pairs[k],
      distractors: pairs.filter((_, i) => i !== k),
      explanation: `In every other pair ${rule.name}. ${pairs[k]} breaks the rule (it should be ${xs[k]} : ${rule.f(xs[k])}).`,
    });
  },
];

// ── Averages ────────────────────────────────────────────────────────────────
const averageExtras: Gen[] = [
  (r) => {
    const n = r.int(8, 20);
    const A = r.int(25, 45);
    const k = r.int(1, 4);
    const S = (n + 1) * (A + k) - n * A;
    const askScore = r.next() < 0.5;
    return mcq(r, {
      prompt: askScore
        ? `A batsman's average after ${n} innings is ${A}. In the ${n + 1}th innings he scores some runs, which raises his average by ${k}. How many runs did he score in that innings?`
        : `A batsman scores ${S} runs in his ${n + 1}th innings, and this raises his average by ${k}. What is his average after the ${n + 1}th innings?`,
      correct: String(askScore ? S : A + k),
      distractors: askScore ? [String(A + k), String(A + k * n), String(S - k), String(n * k + A)] : [String(A), String(A + k + 1), String(S / (n + 1) | 0), String(A + 2 * k)],
      explanation: `New total − old total = new score: ${n + 1}(A + ${k}) − ${n}A = A + ${k * (n + 1)}. ${askScore ? `With A = ${A}: ${S}.` : `So A + ${k * (n + 1)} = ${S} → A = ${A}, new average ${A + k}.`}`,
    });
  },
  (r) => {
    const n = r.int(5, 15);
    const k = r.pick([1, 1.5, 2, 2.5, 3]);
    const out = r.int(30, 60);
    const inc = r.next() < 0.5;
    const ans = inc ? out + n * k : out - n * k;
    if (!Number.isInteger(ans) || ans <= 15) return averageExtras[0](r);
    return mcq(r, {
      prompt: `The average age of ${n} members of a team ${inc ? "increases" : "decreases"} by ${k} years when a member aged ${out} is replaced by a new member. What is the age of the new member?`,
      correct: `${ans} years`,
      distractors: [`${inc ? out + k : out - k} years`, `${inc ? out - n * k : out + n * k} years`, `${ans + n} years`, `${out} years`],
      explanation: `The team's total changes by ${n} × ${k} = ${n * k}. So the new member is ${n * k} years ${inc ? "older" : "younger"} than ${out}: ${ans}.`,
    });
  },
  (r) => {
    const [n1, n2] = [r.int(20, 50), r.int(20, 50)];
    const [a1, a2] = [r.int(40, 80), r.int(40, 80)];
    const total = n1 * a1 + n2 * a2;
    if (total % (n1 + n2) || a1 === a2) return averageExtras[2](rng(r.int(1, 1e9)));
    return mcq(r, {
      prompt: `Section A has ${n1} students with an average score of ${a1}; section B has ${n2} students with an average of ${a2}. What is the average score of all ${n1 + n2} students?`,
      correct: String(total / (n1 + n2)),
      distractors: [String((a1 + a2) / 2), String(total / (n1 + n2) + 1), String(Math.round((a1 * n2 + a2 * n1) / (n1 + n2))), String(total / (n1 + n2) - 1)],
      explanation: `Combined average = (${n1}×${a1} + ${n2}×${a2}) / ${n1 + n2} = ${total}/${n1 + n2} = ${total / (n1 + n2)}. Trap: the simple average of ${a1} and ${a2} ignores the different section sizes.`,
    });
  },
];

// ── Boats & streams ─────────────────────────────────────────────────────────
const boatExtras: Gen[] = [
  (r) => {
    for (;;) {
      const [b, s] = [r.int(6, 15), r.int(1, 5)];
      if (s >= b) continue;
      const T = r.int(2, 10);
      const D = (T * (b * b - s * s)) / (2 * b);
      if (!Number.isInteger(D)) continue;
      return mcq(r, {
        prompt: `A man can row at ${b} km/h in still water, and the river flows at ${s} km/h. He takes ${T} hours to row to a place and come back. How far is the place?`,
        correct: `${D} km`,
        distractors: [`${(T * b) / 2} km`, `${T * (b + s)} km`, `${(T * (b - s)) / 2} km`, `${D + s} km`].filter((x) => !x.includes(".")),
        explanation: `Time = D/(${b}+${s}) + D/(${b}−${s}) = ${T}. So D = ${T} × ${b + s} × ${b - s} / (2 × ${b}) = ${D} km.`,
      });
    }
  },
  (r) => {
    const k = r.int(2, 5);
    return mcq(r, {
      prompt: `A man takes ${k} times as long to row a distance upstream as to row the same distance downstream. What is the ratio of his speed in still water to the speed of the stream?`,
      correct: `${k + 1} : ${k - 1}`,
      distractors: [`${k} : 1`, `${k - 1} : ${k + 1}`, `${k + 1} : 1`, `${2 * k} : 1`],
      explanation: `Downstream speed = ${k} × upstream speed: b + s = ${k}(b − s) → ${k - 1}b = ${k + 1}s → b : s = ${k + 1} : ${k - 1}${k % 2 ? "" : ""}.`,
    });
  },
];

// ── Functions (pseudocode, by value only so the independent checker can run them) ──
const fnExtras: Gen[] = [
  (r) => {
    const [a, b, x] = [r.int(2, 4), r.int(1, 5), r.int(1, 6)];
    const f = (v: number) => v * a + b;
    const ans = f(f(x));
    return pseudoQ(r, `Integer f(Integer v)
    return v * ${a} + ${b}
End function f()

Integer p
Set p = f(f(${x}))
Print p`, ans, [f(x), f(x) * f(x), f(x + 1), f(f(x)) + b], `f(${x}) = ${f(x)}, then f(${f(x)}) = ${ans}. The inner call runs first.`);
  },
  (r) => {
    let start = 0;
    let steps = 0;
    for (;;) {
      start = r.int(3, 40);
      steps = 0;
      for (let v = start; v !== 1; v = v % 2 ? 3 * v + 1 : v / 2) steps++;
      if (steps >= 5 && steps <= 25) break;
    }
    return pseudoQ(r, `Integer g(Integer n)
    if (n mod 2 == 0)
        return n / 2
    end if
    return 3 * n + 1
End function g()

Integer x, c
Set x = ${start}, c = 0
while (x != 1)
    x = g(x)
    c = c + 1
end while
Print c`, steps, [steps + 1, steps - 1, start, Math.floor(steps / 2)], `Trace x: halve when even, 3x + 1 when odd, counting calls until x reaches 1: ${steps} steps.`);
  },
  (r) => {
    const [a, b] = [r.int(2, 9), r.int(2, 9)];
    const sq = (v: number) => v * v;
    const ans = sq(a) - sq(b) + a;
    return pseudoQ(r, `Integer sq(Integer a)
    a = a * a
    return a
End function sq()

Integer a, b, c
Set a = ${a}, b = ${b}
c = sq(a) - sq(b)
Print c + a`, ans, [sq(a) - sq(b) + sq(a), sq(a) - sq(b), (a - b) * (a - b) + a, ans + b], `sq() squares its own copy of a, so the caller's a stays ${a}. c = ${sq(a)} − ${sq(b)} = ${sq(a) - sq(b)}, and c + a = ${ans}. Trap: thinking a became ${sq(a)}.`);
  },
];
function pseudoQ(r: Rng, code: string, ans: number, alts: number[], why: string): Question {
  return mcq(r, { prompt: "What will be the output of the following pseudocode?", code, correct: String(ans), distractors: alts.map(String), explanation: why });
}

/** Extra templates per topic id (standard tier). */
export const VARIETY: Record<string, Gen[]> = {
  "r-direction": directionExtras,
  "r-clock": clockExtras,
  "r-calendar": calendarExtras,
  "r-odd": oddExtras,
  "m-average": averageExtras,
  "m-boats": boatExtras,
  "p-functions": fnExtras,
  ...REASONING_VARIETY,
};
