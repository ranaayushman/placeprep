/**
 * Mathematical Ability generators. Every function is deterministic for a given seed, so a question
 * can be stored as "<topic>:<seed>" and regenerated exactly for review.
 * Numbers are chosen so answers come out clean — the real test favours clean answers too.
 */
import { fmt, fraction, gcd, lcm, mcq, rng, type Rng } from "./rng";
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

/** Data sets for DI: each series has one value per label. Values are multiples of `step`, so answers stay clean. */
const DI_SETS = [
  { title: "Units sold by product", unit: "units", step: 25, range: [4, 24], period: "year", labels: ["2020", "2021", "2022", "2023", "2024"], series: ["Laptops", "Tablets", "Phones"] },
  { title: "Students placed, by department", unit: "students", step: 5, range: [6, 30], period: "year", labels: ["2021", "2022", "2023", "2024", "2025"], series: ["CSE", "ECE", "Mechanical"] },
  { title: "Monthly production of two plants", unit: "tonnes", step: 10, range: [8, 40], period: "month", labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], series: ["Plant A", "Plant B"] },
  { title: "Revenue and expenses of a company", unit: "₹ crore", step: 10, range: [10, 60], period: "year", labels: ["2020", "2021", "2022", "2023", "2024"], series: ["Revenue", "Expenses"] },
  { title: "Visitors to a museum", unit: "thousand", step: 5, range: [4, 30], period: "day", labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], series: ["Adults", "Children"] },
] as const;

const PIE_SETS = [
  { title: "A family's monthly expenses", total: [40, 90], scale: 1000, money: true, parts: ["Food", "Rent", "Education", "Transport", "Savings"] },
  { title: "A company's yearly budget", total: [20, 60], scale: 10, money: true, unit: "₹ crore", parts: ["Salaries", "Marketing", "R&D", "Operations", "Other"] },
  { title: "Students of a college by stream", total: [24, 60], scale: 100, money: false, parts: ["Engineering", "Science", "Commerce", "Arts", "Law"] },
] as const;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Data interpretation: a table, bar chart, line chart or pie chart, with a calculation on it.
 * About a quarter are pie charts (share of a total), the rest series data.
 */
function dataInterpretation(seed: number): Question {
  const r = rng(seed);
  if (r.int(0, 3) === 0) return pieQuestion(r);
  const set = DI_SETS[r.int(0, DI_SETS.length - 1)];
  const data = set.series.map(() => set.labels.map(() => r.int(set.range[0], set.range[1]) * set.step));
  // Line charts only for two series: three crossing lines get too cluttered to read values off.
  const view = r.pick(set.series.length === 2 ? (["table", "bar", "line"] as const) : (["table", "bar"] as const));
  const show =
    view === "table"
      ? { table: [[`${set.title} (${set.unit})`, ...set.labels], ...set.series.map((name, i) => [name, ...data[i].map(String)])] }
      : { chart: { kind: view, title: set.title, unit: set.unit, labels: [...set.labels], series: set.series.map((name, i) => ({ name, values: data[i] })) } };
  const where = view === "table" ? "the table" : `the ${view} chart`;
  const si = r.int(0, set.series.length - 1);
  const s = set.series[si];
  const n = set.labels.length;
  const totals = set.labels.map((_, j) => data.reduce((a, row) => a + row[j], 0));
  const variant = r.int(0, 5);

  if (variant === 0) {
    const j = r.int(0, n - 2);
    const [from, to] = [data[si][j], data[si][j + 1]];
    const change = ((to - from) / from) * 100;
    const say = (x: number) => `${fmt(Math.abs(x))}% ${x >= 0 ? "increase" : "decrease"}`;
    return mcq(r, {
      prompt: `Based on ${where}, what is the percentage change for ${s} from ${set.labels[j]} to ${set.labels[j + 1]}?`,
      ...show,
      correct: say(change),
      distractors: [say(((to - from) / to) * 100), say(-change), say(change + 5), say(change - 4)],
      explanation: `(${to} − ${from}) ÷ ${from} × 100 = ${fmt(change)}%. Always divide by the earlier value.`,
    });
  }
  if (variant === 1) {
    const total = data[si].reduce((a, b) => a + b, 0);
    return mcq(r, {
      prompt: `Based on ${where}, what is the average for ${s} across ${set.labels[0]}–${set.labels[n - 1]} (in ${set.unit})?`,
      ...show,
      correct: fmt(total / n),
      distractors: [fmt(total / (n - 1)), fmt(total / n + set.step), fmt(total / n - set.step / 2), fmt(total / (n + 1))],
      explanation: `Sum = ${data[si].join(" + ")} = ${total}. Average = ${total} ÷ ${n} = ${fmt(total / n)}.`,
    });
  }
  if (variant === 2) {
    const j = r.int(0, n - 1);
    const [a, b] = [data[0][j], data[1][j]];
    const g = gcd(a, b);
    return mcq(r, {
      prompt: `Based on ${where}, what is the ratio of ${set.series[0]} to ${set.series[1]} in ${set.labels[j]}?`,
      ...show,
      correct: `${a / g}:${b / g}`,
      distractors: [`${b / g}:${a / g}`, `${a / g + 1}:${b / g}`, `${a / g}:${b / g + 1}`, `${a / g + 2}:${b / g + 1}`],
      explanation: `${a} : ${b}. Divide both by ${g} → ${a / g}:${b / g}.`,
    });
  }
  if (variant === 3) {
    const j = r.int(0, n - 1);
    return mcq(r, {
      prompt: `Based on ${where}, what is the combined total of ${set.series.join(", ")} in ${set.labels[j]} (in ${set.unit})?`,
      ...show,
      correct: String(totals[j]),
      distractors: [String(totals[j] + set.step), String(totals[j] - set.step), String(totals[(j + 1) % n]), String(totals[j] + 2 * set.step)],
      explanation: `${data.map((row) => row[j]).join(" + ")} = ${totals[j]}.`,
    });
  }
  if (variant === 4) {
    const best = Math.max(...totals);
    // A tie has no single answer, so fall back to the difference question.
    if (totals.filter((t) => t === best).length === 1) {
      const j = totals.indexOf(best);
      const others = r.shuffle(set.labels.filter((_, k) => k !== j)).slice(0, 3);
      return mcq(r, {
        prompt: `Based on ${where}, in which ${set.period} was the combined total of ${set.series.join(" and ")} the highest?`,
        ...show,
        correct: set.labels[j],
        distractors: others,
        explanation: `Totals: ${set.labels.map((l, k) => `${l} ${totals[k]}`).join(", ")}. The highest is ${set.labels[j]} (${best}).`,
      });
    }
  }
  if (variant === 5) {
    const j = r.int(0, n - 1);
    const share = (data[si][j] / totals[j]) * 100;
    const pc = (x: number) => `${fmt(x, 1)}%`;
    return mcq(r, {
      prompt: `Based on ${where}, what percentage of the combined total in ${set.labels[j]} came from ${s}?`,
      ...show,
      correct: pc(share),
      distractors: [pc(100 - share), pc(share + 5), pc(share - 5), pc((data[si][j] / (totals[j] + data[si][j])) * 100)],
      explanation: `${s} = ${data[si][j]}, total = ${totals[j]}. ${data[si][j]} ÷ ${totals[j]} × 100 = ${fmt(share, 1)}%.`,
    });
  }
  // Difference of two series over all labels (also the tie fallback above).
  const sum = (row: readonly number[]) => row.reduce((a, b) => a + b, 0);
  const diff = Math.abs(sum(data[0]) - sum(data[1]));
  return mcq(r, {
    prompt: `Based on ${where}, by how much does the total of ${set.series[0]} differ from the total of ${set.series[1]} across all ${n} periods (in ${set.unit})?`,
    ...show,
    correct: String(diff),
    distractors: [String(diff + set.step), String(Math.abs(diff - set.step) || set.step * 3), String(diff + 2 * set.step), String(diff * 2 || set.step * 2)],
    explanation: `${set.series[0]}: ${data[0].join(" + ")} = ${sum(data[0])}. ${set.series[1]}: ${data[1].join(" + ")} = ${sum(data[1])}. Difference = ${diff}.`,
  });
}

/** Pie charts: shares of a total, in steps of 5%, every share at least 5%. */
function pieQuestion(r: Rng): Question {
  const set = PIE_SETS[r.int(0, PIE_SETS.length - 1)];
  const pct = set.parts.map(() => 5);
  for (let left = 75; left > 0; left -= 5) pct[r.int(0, pct.length - 1)] += 5;
  const total = r.int(set.total[0], set.total[1]) * set.scale;
  const amount = (p: number) => (total * p) / 100;
  const unit = "unit" in set ? set.unit : undefined;
  const show = (n: number) => (set.money ? (unit ? `₹${fmt(n)} crore` : inr(n)) : String(n));
  const totalText = set.money ? (unit ? `₹${total} crore` : inr(total)) : `${total} students`;
  const chart = { kind: "pie" as const, title: `${set.title} (total ${totalText})`, unit: "%", labels: [...set.parts], series: [{ name: "Share", values: pct }] };
  const [i, k] = r.shuffle(set.parts.map((_, x) => x)).slice(0, 2);
  const variant = r.int(0, 3);
  if (variant === 0) {
    return mcq(r, {
      prompt: set.money ? `Based on the pie chart, how much goes to ${set.parts[i]}?` : `Based on the pie chart, how many students are in ${set.parts[i]}?`,
      chart,
      correct: show(amount(pct[i])),
      distractors: [show(amount(pct[i] + 5)), show(amount(Math.max(pct[i] - 5, 1))), show(amount(pct[k])), show(amount(pct[i]) * 2)],
      explanation: `${pct[i]}% of ${totalText} = ${total} × ${pct[i]} ÷ 100 = ${show(amount(pct[i]))}.`,
    });
  }
  if (variant === 1) {
    const deg = pct[i] * 3.6;
    return mcq(r, {
      prompt: `Based on the pie chart, what is the central angle of the ${set.parts[i]} sector?`,
      chart,
      correct: `${fmt(deg)}°`,
      distractors: [`${fmt(deg + 18)}°`, `${fmt(Math.abs(deg - 18) || 9)}°`, `${pct[i]}°`, `${fmt(deg * 2)}°`],
      explanation: `A full circle is 360°, so 1% = 3.6°. ${pct[i]}% × 3.6 = ${fmt(deg)}°.`,
    });
  }
  if (variant === 2 && pct[i] !== pct[k]) {
    const [hi, lo] = pct[i] > pct[k] ? [i, k] : [k, i];
    const d = amount(pct[hi] - pct[lo]);
    return mcq(r, {
      prompt: set.money ? `Based on the pie chart, how much more goes to ${set.parts[hi]} than to ${set.parts[lo]}?` : `Based on the pie chart, how many more students are in ${set.parts[hi]} than in ${set.parts[lo]}?`,
      chart,
      correct: show(d),
      distractors: [show(d + amount(5)), show(amount(pct[hi])), show(d * 2), show(Math.abs(d - amount(5)) || amount(10))],
      explanation: `${pct[hi]}% − ${pct[lo]}% = ${pct[hi] - pct[lo]}% of ${totalText} = ${show(d)}.`,
    });
  }
  const g = gcd(pct[i], pct[k]);
  return mcq(r, {
    prompt: `Based on the pie chart, what is the ratio of ${set.parts[i]} to ${set.parts[k]}?`,
    chart,
    correct: `${pct[i] / g}:${pct[k] / g}`,
    distractors: [`${pct[k] / g}:${pct[i] / g}`, `${pct[i] / g + 1}:${pct[k] / g}`, `${pct[i] / g}:${pct[k] / g + 1}`, `${pct[i]}:${pct[k] + 5}`],
    explanation: `The ratio of amounts equals the ratio of shares: ${pct[i]}% : ${pct[k]}% → ${pct[i] / g}:${pct[k] / g}.`,
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
  { id: "m-di", section: "math", label: "Data Interpretation", weight: 4, targetSec: 210, generate: dataInterpretation },
];
