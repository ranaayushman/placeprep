/**
 * Mathematical Ability generators. Every function is deterministic for a given seed, so a question
 * can be stored as "<topic>:<seed>" and regenerated exactly for review.
 * Numbers are chosen so answers come out clean — the real test favours clean answers too.
 */
import { fmt, fraction, gcd, lcm, mcq, rng } from "./rng";
import type { Question, Topic } from "./types";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const pct = (n: number) => `${fmt(n)}%`;

function percentages(seed: number): Question {
  const r = rng(seed);
  const variant = r.int(0, 2);
  if (variant === 0) {
    const x = r.pick([20, 25, 50, 60, 100, 150, 300]);
    const ans = (x / (100 + x)) * 100;
    return mcq(r, {
      prompt: `A's salary is ${x}% more than B's salary. By what percent is B's salary less than A's?`,
      correct: pct(ans),
      distractors: [pct(x), pct((x / (100 - Math.min(x, 90))) * 100), pct(ans + 5), pct(x / 2)],
      explanation: `Let B = 100, so A = ${100 + x}. B is less by ${x} out of ${100 + x} → ${x}/${100 + x} × 100 = ${fmt(ans)}%.`,
    });
  }
  if (variant === 1) {
    const a = r.pick([10, 20, 25, 30, 40, 50]);
    const b = r.pick([10, 20, 25, 30, 40, 50]);
    const net = a - b - (a * b) / 100;
    const word = net >= 0 ? "increase" : "decrease";
    const say = (n: number) => `${fmt(Math.abs(n))}% ${n >= 0 ? "increase" : "decrease"}`;
    return mcq(r, {
      prompt: `The price of an item is increased by ${a}% and then decreased by ${b}%. What is the net change in price?`,
      correct: say(net),
      distractors: [say(a - b), say(-net), say(a - b + (a * b) / 100), say(net + 2)],
      explanation: `Net change = a − b − ab/100 = ${a} − ${b} − ${(a * b) / 100} = ${fmt(net)}%, a net ${word}.`,
    });
  }
  const rate = r.pick([5, 10, 20]);
  const base = r.pick([8000, 10000, 12000, 20000, 25000, 40000]);
  const after = Math.round(base * (1 + rate / 100) ** 2);
  return mcq(r, {
    prompt: `The population of a town is ${base.toLocaleString("en-IN")}. It grows at ${rate}% per year. What will it be after 2 years?`,
    correct: after.toLocaleString("en-IN"),
    distractors: [
      (base + (2 * base * rate) / 100).toLocaleString("en-IN"),
      Math.round(base * (1 + rate / 100)).toLocaleString("en-IN"),
      (after + base / 100).toLocaleString("en-IN"),
      (after - base / 50).toLocaleString("en-IN"),
    ],
    explanation: `Growth compounds: ${base} × (1 + ${rate}/100)² = ${after}. Adding ${rate}% twice on the original (simple growth) is the common trap.`,
  });
}

function profitLoss(seed: number): Question {
  const r = rng(seed);
  if (r.next() < 0.5) {
    const m = r.pick([20, 25, 40, 50]);
    const d = r.pick([10, 20, 25]);
    const p = ((1 + m / 100) * (1 - d / 100) - 1) * 100;
    const say = (n: number) => (n >= 0 ? `${fmt(n)}% profit` : `${fmt(-n)}% loss`);
    return mcq(r, {
      prompt: `A shopkeeper marks his goods ${m}% above cost price and then gives a discount of ${d}%. What is his profit or loss percent?`,
      correct: say(p),
      distractors: [say(m - d), say(p + 5), say(-p), say(p - 2)],
      explanation: `Take CP = 100 → MP = ${100 + m} → SP = ${100 + m} × ${(100 - d) / 100} = ${fmt(100 + p)}. Result: ${say(p)}. (Not ${m} − ${d} — the discount applies to the marked price.)`,
    });
  }
  const loss = r.pick([5, 10, 12, 15, 20]);
  const gain = r.pick([5, 8, 10, 15]);
  const cp = r.pick([400, 500, 800, 1000, 1200, 1500, 2000]);
  const diff = (cp * (loss + gain)) / 100;
  return mcq(r, {
    prompt: `An article is sold at a loss of ${loss}%. Had it been sold for ${rupees(diff)} more, there would have been a gain of ${gain}%. What is the cost price?`,
    correct: rupees(cp),
    distractors: [rupees((diff * 100) / Math.max(1, gain)), rupees(cp + 100), rupees(cp - 100), rupees((diff * 100) / (loss + gain + 5))],
    explanation: `The ${rupees(diff)} covers the swing from −${loss}% to +${gain}%, i.e. ${loss + gain}% of CP. CP = ${diff} × 100 / ${loss + gain} = ${cp}.`,
  });
}

function timeWork(seed: number): Question {
  const r = rng(seed);
  const pairs: [number, number][] = [
    [10, 15], [12, 24], [20, 30], [6, 12], [18, 36], [15, 30], [24, 40], [12, 36], [20, 60], [30, 45],
  ];
  const [a, b] = r.pick(pairs);
  const together = (a * b) / (a + b);
  const variant = r.int(0, 1);
  if (variant === 0) {
    return mcq(r, {
      prompt: `A can finish a piece of work in ${a} days and B can finish it in ${b} days. In how many days will they finish it working together?`,
      correct: `${fmt(together)} days`,
      distractors: [`${(a + b) / 2} days`, `${fmt(together + 2)} days`, `${Math.abs(b - a)} days`, `${fmt(together - 1)} days`],
      explanation: `Per-day work: 1/${a} + 1/${b} = ${fraction(a + b, a * b)}. Days = ${a}×${b}/(${a}+${b}) = ${fmt(together)}.`,
    });
  }
  // A works x days alone, then B finishes the rest.
  const x = r.int(1, a - 1);
  const remaining = 1 - x / a;
  const bDays = remaining * b;
  return mcq(r, {
    prompt: `A can do a job in ${a} days and B in ${b} days. A works alone for ${x} days and then leaves. How many days will B take to finish the remaining work?`,
    correct: `${fmt(bDays)} days`,
    distractors: [`${b - x} days`, `${fmt(bDays + 2)} days`, `${fmt(bDays - 1.5)} days`, `${fmt((remaining * a * b) / (a + b))} days`],
    explanation: `A finishes ${x}/${a} of the job, leaving ${fraction(a - x, a)}. B needs ${fraction(a - x, a)} × ${b} = ${fmt(bDays)} days.`,
  });
}

function speedDistance(seed: number): Question {
  const r = rng(seed);
  const variant = r.int(0, 2);
  if (variant === 0) {
    const kmph = r.pick([36, 54, 72, 90, 108]);
    const ms = (kmph * 5) / 18;
    const t = r.int(8, 20);
    const len = ms * t;
    return mcq(r, {
      prompt: `A train running at ${kmph} km/h crosses a pole in ${t} seconds. What is the length of the train?`,
      correct: `${len} m`,
      distractors: [`${kmph * t} m`, `${len + 20} m`, `${len - 15} m`, `${Math.round((kmph * t * 18) / 50)} m`],
      explanation: `${kmph} km/h = ${kmph} × 5/18 = ${ms} m/s. Length = speed × time = ${ms} × ${t} = ${len} m.`,
    });
  }
  if (variant === 1) {
    const kmph = r.pick([36, 54, 72]);
    const ms = (kmph * 5) / 18;
    const trainLen = r.pick([100, 120, 150, 180, 200]);
    const t = r.int(15, 30);
    const platform = ms * t - trainLen;
    if (platform <= 0) return speedDistance(seed + 7919);
    return mcq(r, {
      prompt: `A ${trainLen} m long train running at ${kmph} km/h crosses a platform in ${t} seconds. What is the length of the platform?`,
      correct: `${platform} m`,
      distractors: [`${ms * t} m`, `${platform + trainLen * 2} m`, `${platform + 30} m`, `${Math.abs(platform - 40)} m`],
      explanation: `Distance covered = train + platform = ${ms} m/s × ${t} s = ${ms * t} m. Platform = ${ms * t} − ${trainLen} = ${platform} m.`,
    });
  }
  const [a, b] = r.pick([[40, 60], [30, 60], [20, 30], [60, 90], [45, 90], [36, 45]] as [number, number][]);
  const avg = (2 * a * b) / (a + b);
  return mcq(r, {
    prompt: `A car goes from P to Q at ${a} km/h and returns from Q to P at ${b} km/h. What is the average speed for the whole journey?`,
    correct: `${fmt(avg)} km/h`,
    distractors: [`${(a + b) / 2} km/h`, `${fmt(avg + 3)} km/h`, `${fmt(Math.sqrt(a * b))} km/h`, `${fmt(avg - 2)} km/h`],
    explanation: `Equal distances, so use the harmonic mean: 2ab/(a+b) = 2×${a}×${b}/${a + b} = ${fmt(avg)} km/h — not the simple average ${(a + b) / 2}.`,
  });
}

function boatsStreams(seed: number): Question {
  const r = rng(seed);
  const boat = r.int(6, 15);
  const stream = r.int(1, Math.min(5, boat - 2));
  const down = boat + stream;
  const up = boat - stream;
  const t1 = r.int(2, 5);
  const t2 = r.int(2, 5);
  const askStream = r.next() < 0.5;
  const ans = askStream ? stream : boat;
  return mcq(r, {
    prompt: `A boat covers ${down * t1} km downstream in ${t1} hours and ${up * t2} km upstream in ${t2} hours. What is the speed of the ${askStream ? "stream" : "boat in still water"}?`,
    correct: `${ans} km/h`,
    distractors: [`${askStream ? boat : stream} km/h`, `${ans + 1} km/h`, `${down - up} km/h`, `${ans + 2} km/h`],
    explanation: `Downstream = ${down} km/h, upstream = ${up} km/h. Boat = (${down}+${up})/2 = ${boat}; stream = (${down}−${up})/2 = ${stream}.`,
  });
}

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
const nCr = (n: number, k: number) => factorial(n) / (factorial(k) * factorial(n - k));

function permutations(seed: number): Question {
  const r = rng(seed);
  const variant = r.int(0, 2);
  if (variant === 0) {
    const word = r.pick(["LEVEL", "APPLE", "BANANA", "LETTER", "SCHOOL", "INFOSYS", "SUCCESS", "GARDEN", "MANGO", "COFFEE"]);
    const counts = new Map<string, number>();
    for (const ch of word) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    const denom = [...counts.values()].reduce((p, c) => p * factorial(c), 1);
    const ans = factorial(word.length) / denom;
    const repeats = [...counts.entries()].filter(([, c]) => c > 1).map(([ch, c]) => `${ch}×${c}`);
    return mcq(r, {
      prompt: `In how many different ways can the letters of the word "${word}" be arranged?`,
      correct: `${ans}`,
      distractors: [`${factorial(word.length)}`, `${ans * 2}`, `${ans / 2 === Math.floor(ans / 2) ? ans / 2 : ans + 6}`, `${factorial(word.length - 1)}`],
      explanation: repeats.length
        ? `${word.length} letters with repeats (${repeats.join(", ")}): ${word.length}! / ${[...counts.values()].filter((c) => c > 1).map((c) => `${c}!`).join(" × ")} = ${ans}.`
        : `All ${word.length} letters are distinct: ${word.length}! = ${ans}.`,
    });
  }
  if (variant === 1) {
    const men = r.int(5, 8);
    const women = r.int(4, 6);
    const km = r.int(2, 3);
    const kw = r.int(1, 2);
    const ans = nCr(men, km) * nCr(women, kw);
    return mcq(r, {
      prompt: `A committee of ${km} men and ${kw} ${kw === 1 ? "woman" : "women"} is to be formed from ${men} men and ${women} women. In how many ways can this be done?`,
      correct: `${ans}`,
      distractors: [`${nCr(men + women, km + kw)}`, `${nCr(men, km) + nCr(women, kw)}`, `${ans * 2}`, `${ans - nCr(women, kw)}`],
      explanation: `Choose men and women independently and multiply: C(${men},${km}) × C(${women},${kw}) = ${nCr(men, km)} × ${nCr(women, kw)} = ${ans}.`,
    });
  }
  const n = r.int(5, 7);
  const ans = factorial(n - 1) * 2;
  return mcq(r, {
    prompt: `In how many ways can ${n} people sit in a row if two particular people must always sit together?`,
    correct: `${ans}`,
    distractors: [`${factorial(n - 1)}`, `${factorial(n)}`, `${factorial(n) - ans}`, `${ans * 2}`],
    explanation: `Glue the pair into one unit: ${n - 1} units → ${n - 1}! ways; the pair can swap → ×2. Total = ${ans}.`,
  });
}

function probability(seed: number): Question {
  const r = rng(seed);
  if (r.next() < 0.5) {
    const s = r.int(4, 10);
    let count = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === s) count++;
    return mcq(r, {
      prompt: `Two fair dice are thrown together. What is the probability that the sum is ${s}?`,
      correct: fraction(count, 36),
      distractors: [fraction(count + 1, 36), fraction(1, 6), fraction(count, 12), fraction(Math.max(1, count - 1), 36)],
      explanation: `There are 36 equally likely outcomes, and ${count} of them sum to ${s}. P = ${count}/36 = ${fraction(count, 36)}.`,
    });
  }
  const red = r.int(3, 6);
  const green = r.int(2, 5);
  const blue = r.int(2, 4);
  const n = red + green + blue;
  const num = nCr(red, 2);
  const den = nCr(n, 2);
  return mcq(r, {
    prompt: `A bag has ${red} red, ${green} green and ${blue} blue balls. Two balls are drawn at random without replacement. What is the probability that both are red?`,
    correct: fraction(num, den),
    distractors: [fraction(red * red, n * n), fraction(red, n), fraction(num + 1, den), fraction(red - 1, n)],
    explanation: `C(${red},2) / C(${n},2) = ${num}/${den} = ${fraction(num, den)}.`,
  });
}

function ratioMixture(seed: number): Question {
  const r = rng(seed);
  if (r.next() < 0.5) {
    const ageA = r.int(20, 45);
    const ageB = r.int(10, ageA - 4);
    const n = r.int(4, 10);
    const g1 = gcd(ageA, ageB);
    const g2 = gcd(ageA + n, ageB + n);
    return mcq(r, {
      prompt: `The present ages of A and B are in the ratio ${ageA / g1}:${ageB / g1}. After ${n} years, the ratio will be ${(ageA + n) / g2}:${(ageB + n) / g2}. What is A's present age?`,
      correct: `${ageA} years`,
      distractors: [`${ageA + n} years`, `${ageB} years`, `${ageA - 2} years`, `${ageA + 4} years`],
      explanation: `Let ages be ${ageA / g1}k and ${ageB / g1}k. Solve (${ageA / g1}k+${n})/(${ageB / g1}k+${n}) = ${(ageA + n) / g2}/${(ageB + n) / g2} → k = ${g1}, so A = ${ageA}.`,
    });
  }
  const p1 = r.pick([20, 30, 40, 60]);
  const p2 = p1 + r.pick([20, 30, 40, 60]);
  const m = r.int(p1 + 1, p2 - 1);
  const g = gcd(p2 - m, m - p1);
  return mcq(r, {
    prompt: `In what ratio must rice at ₹${p1}/kg be mixed with rice at ₹${p2}/kg so that the mixture costs ₹${m}/kg?`,
    correct: `${(p2 - m) / g}:${(m - p1) / g}`,
    distractors: [`${(m - p1) / g}:${(p2 - m) / g}`, `${p1 / gcd(p1, p2)}:${p2 / gcd(p1, p2)}`, `1:1`, `${(p2 - m) / g + 1}:${(m - p1) / g}`],
    explanation: `Alligation: cheaper : dearer = (${p2} − ${m}) : (${m} − ${p1}) = ${p2 - m}:${m - p1} = ${(p2 - m) / g}:${(m - p1) / g}.`,
  });
}

function interest(seed: number): Question {
  const r = rng(seed);
  for (let i = 0; i < 20; i++) {
    const p = r.pick([5000, 8000, 10000, 12000, 15000, 20000, 25000]);
    const rate = r.pick([4, 5, 8, 10, 12, 20]);
    const diff = (p * rate * rate) / 10000;
    if (!Number.isInteger(diff)) continue;
    return mcq(r, {
      prompt: `What is the difference between compound interest and simple interest on ${rupees(p)} for 2 years at ${rate}% per annum?`,
      correct: rupees(diff),
      distractors: [rupees(diff * 2), rupees((p * rate) / 100), rupees(diff + 10), rupees(Math.max(1, diff - 5))],
      explanation: `For 2 years, CI − SI = P(r/100)² = ${p} × (${rate}/100)² = ${rupees(diff)}.`,
    });
  }
  return interest(seed + 1);
}

function numberSystem(seed: number): Question {
  const r = rng(seed);
  const variant = r.int(0, 1);
  if (variant === 0) {
    const divisors = r.shuffle([4, 6, 8, 9, 10, 12, 15, 18]).slice(0, 3).sort((a, b) => a - b);
    const L = divisors.reduce(lcm);
    const rem = r.int(1, divisors[0] - 1);
    return mcq(r, {
      prompt: `What is the smallest number which, when divided by ${divisors.join(", ")}, leaves a remainder of ${rem} in each case?`,
      correct: `${L + rem}`,
      distractors: [`${L}`, `${L - rem}`, `${divisors.reduce((a, b) => a * b) + rem}`, `${L * 2 + rem}`],
      explanation: `LCM(${divisors.join(", ")}) = ${L}. Add the common remainder: ${L} + ${rem} = ${L + rem}.`,
    });
  }
  const base = r.pick([2, 3, 7, 8, 9, 13, 17]);
  const exp = r.int(21, 99);
  const cycle: number[] = [];
  let v = base % 10;
  while (!cycle.includes(v)) {
    cycle.push(v);
    v = (v * base) % 10;
  }
  const ans = cycle[(exp - 1) % cycle.length];
  return mcq(r, {
    prompt: `What is the unit digit of ${base}^${exp}?`,
    correct: `${ans}`,
    distractors: cycle.filter((d) => d !== ans).map(String).concat(["0", "5", "1"]),
    explanation: `Unit digits of ${base}^n repeat in the cycle ${cycle.join(", ")} (length ${cycle.length}). ${exp} mod ${cycle.length} = ${exp % cycle.length || cycle.length} → ${ans}.`,
  });
}

function averages(seed: number): Question {
  const r = rng(seed);
  const n = r.int(5, 12);
  const avg = r.int(20, 60);
  const removed = r.int(avg - 15, avg + 25);
  const newAvg = (n * avg - removed) / (n - 1);
  if (!Number.isInteger(newAvg)) return averages(seed + 1);
  return mcq(r, {
    prompt: `The average of ${n} numbers is ${avg}. When one number is removed, the average of the remaining numbers becomes ${newAvg}. Which number was removed?`,
    correct: `${removed}`,
    distractors: [`${Math.abs(avg - newAvg)}`, `${removed + n}`, `${avg + newAvg}`, `${removed - 3}`],
    explanation: `Total = ${n} × ${avg} = ${n * avg}. Remaining total = ${n - 1} × ${newAvg} = ${(n - 1) * newAvg}. Removed = ${n * avg - (n - 1) * newAvg}.`,
  });
}

function mensuration(seed: number): Question {
  const r = rng(seed);
  if (r.next() < 0.5) {
    const x = r.pick([10, 20, 25, 30, 50]);
    const y = r.pick([10, 20, 25, 30]);
    const change = x - y - (x * y) / 100;
    const say = (n: number) => `${fmt(Math.abs(n))}% ${n >= 0 ? "increase" : "decrease"}`;
    return mcq(r, {
      prompt: `The length of a rectangle is increased by ${x}% and its breadth is decreased by ${y}%. What is the percentage change in its area?`,
      correct: say(change),
      distractors: [say(x - y), say(-change), say(x + y), say(change + 3)],
      explanation: `New area = (1 + ${x}/100)(1 − ${y}/100) = ${fmt(1 + change / 100, 4)} of the original → ${say(change)}.`,
    });
  }
  const radius = r.pick([7, 14, 21, 28, 35]);
  const area = (22 / 7) * radius * radius;
  const circ = 2 * (22 / 7) * radius;
  return mcq(r, {
    prompt: `The area of a circle is ${area} cm². What is its circumference? (Take π = 22/7)`,
    correct: `${circ} cm`,
    distractors: [`${circ / 2} cm`, `${circ + 22} cm`, `${radius * 4} cm`, `${circ * 2} cm`],
    explanation: `πr² = ${area} → r² = ${radius * radius} → r = ${radius}. Circumference = 2πr = ${circ} cm.`,
  });
}

function dataInterpretation(seed: number): Question {
  const r = rng(seed);
  const years = [2020, 2021, 2022, 2023, 2024];
  const products = ["Laptops", "Tablets", "Phones"];
  const data = products.map(() => years.map(() => r.int(4, 24) * 25));
  const table = [["Product (units)", ...years.map(String)], ...products.map((p, i) => [p, ...data[i].map(String)])];
  const pi = r.int(0, 2);
  const variant = r.int(0, 2);
  if (variant === 0) {
    const [y1, y2] = [r.int(0, 3), 0];
    const from = data[pi][y1];
    const to = data[pi][y1 + 1 + y2];
    const change = ((to - from) / from) * 100;
    const say = (n: number) => `${fmt(Math.abs(n))}% ${n >= 0 ? "increase" : "decrease"}`;
    return mcq(r, {
      prompt: `What is the percentage change in ${products[pi]} sales from ${years[y1]} to ${years[y1 + 1]}?`,
      table,
      correct: say(change),
      distractors: [say(((to - from) / to) * 100), say(-change), say(change + 5), say(change - 4)],
      explanation: `(${to} − ${from}) / ${from} × 100 = ${fmt(change)}%. Always divide by the earlier year's value.`,
    });
  }
  if (variant === 1) {
    const total = data[pi].reduce((a, b) => a + b, 0);
    return mcq(r, {
      prompt: `What is the average yearly sales of ${products[pi]} over the five years?`,
      table,
      correct: fmt(total / 5),
      distractors: [fmt(total / 4), fmt(total / 5 + 25), fmt(total / 5 - 15), fmt(total / 6)],
      explanation: `Sum = ${data[pi].join(" + ")} = ${total}. Average = ${total} / 5 = ${fmt(total / 5)}.`,
    });
  }
  const yi = r.int(0, 4);
  const a = data[0][yi];
  const b = data[1][yi];
  const g = gcd(a, b);
  return mcq(r, {
    prompt: `In ${years[yi]}, what is the ratio of Laptops sold to Tablets sold?`,
    table,
    correct: `${a / g}:${b / g}`,
    distractors: [`${b / g}:${a / g}`, `${a / g + 1}:${b / g}`, `${a / g}:${b / g + 1}`, `${Math.round(a / 25)}:${Math.round(b / 25) + 2}`],
    explanation: `${a} : ${b} — divide both by ${g} → ${a / g}:${b / g}.`,
  });
}

export const mathTopics: Topic[] = [
  { id: "m-percent", section: "math", label: "Percentages", weight: 3, targetSec: 150, generate: percentages },
  { id: "m-profit", section: "math", label: "Profit, Loss & Discount", weight: 2, targetSec: 180, generate: profitLoss },
  { id: "m-timework", section: "math", label: "Time & Work", weight: 2, targetSec: 180, generate: timeWork },
  { id: "m-speed", section: "math", label: "Speed, Time & Distance", weight: 3, targetSec: 180, generate: speedDistance },
  { id: "m-boats", section: "math", label: "Boats & Streams", weight: 1, targetSec: 150, generate: boatsStreams },
  { id: "m-pnc", section: "math", label: "Permutation & Combination", weight: 3, targetSec: 210, generate: permutations },
  { id: "m-prob", section: "math", label: "Probability", weight: 3, targetSec: 180, generate: probability },
  { id: "m-ratio", section: "math", label: "Ratio, Ages & Mixtures", weight: 2, targetSec: 180, generate: ratioMixture },
  { id: "m-interest", section: "math", label: "Simple & Compound Interest", weight: 1, targetSec: 150, generate: interest },
  { id: "m-number", section: "math", label: "Number System & LCM/HCF", weight: 2, targetSec: 150, generate: numberSystem },
  { id: "m-average", section: "math", label: "Averages", weight: 1, targetSec: 120, generate: averages },
  { id: "m-mensuration", section: "math", label: "Areas & Mensuration", weight: 1, targetSec: 150, generate: mensuration },
  { id: "m-di", section: "math", label: "Data Interpretation", weight: 2, targetSec: 210, generate: dataInterpretation },
];
