/** Logical / Reasoning Ability: generators plus small original static banks. */
import { mcq, rng, staticMcq, type Rng } from "./rng";
import { RELATION_REASON, RELATION_WORDS, sentence, solveChain, solveSyllogism, STEP_WORDS, type Form, type Prop } from "./logic";
import type { Question, Topic } from "./types";

const NAMES = ["Aman", "Bela", "Chirag", "Divya", "Esha", "Farhan", "Gita", "Harsh", "Isha", "Jatin", "Kavya", "Laksh"];

function numberSeries(seed: number): Question {
  const r = rng(seed);
  const kind = r.int(0, 6);
  let terms: number[] = [];
  let rule = "";
  const a = r.int(2, 9);
  if (kind === 0) {
    const d = r.int(2, 5);
    terms = [a];
    for (let i = 1; i < 6; i++) terms.push(terms[i - 1] + d * i);
    rule = `Differences increase by ${d}: +${d}, +${2 * d}, +${3 * d}, …`;
  } else if (kind === 1) {
    const k = r.int(2, 3);
    const c = r.int(1, 3);
    terms = [a];
    for (let i = 1; i < 6; i++) terms.push(terms[i - 1] * k + c);
    rule = `Each term = previous × ${k} + ${c}.`;
  } else if (kind === 2) {
    const s = r.int(1, 6);
    terms = Array.from({ length: 6 }, (_, i) => (i + s) ** 2 + 1);
    rule = `Squares plus one: ${s}²+1, ${s + 1}²+1, …`;
  } else if (kind === 3) {
    const s = r.int(1, 4);
    terms = Array.from({ length: 6 }, (_, i) => (i + s) ** 3 - 1);
    rule = `Cubes minus one: ${s}³−1, ${s + 1}³−1, …`;
  } else if (kind === 4) {
    terms = [a, a + r.int(1, 4)];
    for (let i = 2; i < 6; i++) terms.push(terms[i - 1] + terms[i - 2]);
    rule = `Each term is the sum of the previous two.`;
  } else if (kind === 5) {
    const x = r.int(2, 4);
    const y = r.int(1, 6);
    terms = [a];
    for (let i = 1; i < 6; i++) terms.push(i % 2 ? terms[i - 1] * x : terms[i - 1] + y);
    rule = `Alternating operations: × ${x}, + ${y}, × ${x}, + ${y}, …`;
  } else {
    const s = r.int(1, 5);
    terms = Array.from({ length: 6 }, (_, i) => (i + s) * (i + s + 1));
    rule = `n × (n + 1): ${s}×${s + 1}, ${s + 1}×${s + 2}, …`;
  }
  const ans = terms[5];
  return mcq(r, {
    prompt: `Find the next number in the series:`,
    code: `${terms.slice(0, 5).join(", ")}, ?`,
    correct: `${ans}`,
    distractors: [`${ans + 1}`, `${ans - 2}`, `${ans + (terms[4] - terms[3])}`, `${2 * terms[4] - terms[3]}`],
    explanation: `${rule} So the next term is ${ans}.`,
  });
}

function codingDecoding(seed: number): Question {
  const r = rng(seed);
  const words = ["CAT", "DOG", "MILK", "BOOK", "LAMP", "FISH", "CODE", "DESK", "GOLD", "ROSE", "TREE", "WIND", "PEN", "SALT"];
  const [w1, w2] = r.shuffle(words);
  const kind = r.int(0, 2);
  const shiftCh = (ch: string, k: number) => String.fromCharCode(((ch.charCodeAt(0) - 65 + k + 26 * 3) % 26) + 65);
  let enc: (w: string) => string;
  let rule: string;
  if (kind === 0) {
    const k = r.pick([1, 2, 3, -1, -2]);
    enc = (w) => [...w].map((c) => shiftCh(c, k)).join("");
    rule = `Each letter is shifted ${Math.abs(k)} place(s) ${k > 0 ? "forward" : "backward"}.`;
  } else if (kind === 1) {
    enc = (w) => [...w].map((c, i) => shiftCh(c, i + 1)).join("");
    rule = `Letters are shifted +1, +2, +3, … by position.`;
  } else {
    const k = r.pick([1, 2]);
    enc = (w) => [...w].reverse().map((c) => shiftCh(c, k)).join("");
    rule = `The word is reversed, then each letter is shifted +${k}.`;
  }
  const ans = enc(w2);
  const wrongShift = [...w2].map((c) => shiftCh(c, 1)).join("");
  const wrongRev = [...ans].reverse().join("");
  return mcq(r, {
    prompt: `In a certain code, ${w1} is written as ${enc(w1)}. How is ${w2} written in that code?`,
    correct: ans,
    distractors: [wrongRev, wrongShift, [...w2].map((c) => shiftCh(c, -1)).join(""), ans.slice(1) + ans[0]],
    explanation: `${rule} Applying it to ${w2} gives ${ans}.`,
  }, (i) => ans.slice(0, -1) + shiftCh(ans[ans.length - 1], i));
}

function directions(seed: number): Question {
  const r = rng(seed);
  const [p, q, h] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5], [9, 12, 15]] as [number, number, number][]);
  // Walk: North a, East b, South c, East d.  dy = a - c = p, dx = b + d = q
  const c = r.int(2, 6);
  const a = c + p;
  const b = r.int(1, q - 1);
  const d = q - b;
  const flipX = r.next() < 0.5;
  const E = flipX ? "west" : "east";
  const name = r.pick(NAMES);
  const dirName = `North-${flipX ? "West" : "East"}`;
  const wrongDirs = ["North-East", "North-West", "South-East", "South-West", "North", "East"].filter((x) => x !== dirName);
  return mcq(r, {
    prompt: `${name} walks ${a} km north, turns and walks ${b} km ${E}, then walks ${c} km south and finally ${d} km ${E}. How far and in which direction is ${name} from the starting point?`,
    correct: `${h} km, ${dirName}`,
    distractors: [`${h} km, ${wrongDirs[0]}`, `${a + b + c + d} km, ${dirName}`, `${p + q} km, ${dirName}`, `${h} km, ${wrongDirs[1]}`],
    explanation: `Net north = ${a} − ${c} = ${p} km; net ${E} = ${b} + ${d} = ${q} km. Distance = √(${p}² + ${q}²) = ${h} km, towards the ${dirName}.`,
  });
}

function clocks(seed: number): Question {
  const r = rng(seed);
  const h = r.int(1, 11);
  const m = r.int(1, 29) * 2;
  let theta = Math.abs(30 * h - 5.5 * m);
  if (theta > 180) theta = 360 - theta;
  const mm = String(m).padStart(2, "0");
  return mcq(r, {
    prompt: `What is the angle between the hour hand and the minute hand of a clock at ${h}:${mm}?`,
    correct: `${theta}°`,
    distractors: [`${360 - theta}°`, `${Math.abs(30 * h - 6 * m) % 360}°`, `${theta + 5}°`, `${Math.abs(theta - 15)}°`],
    explanation: `Angle = |30H − 5.5M| = |${30 * h} − ${5.5 * m}| = ${Math.abs(30 * h - 5.5 * m)}°${Math.abs(30 * h - 5.5 * m) > 180 ? `; the smaller angle is 360 − that = ${theta}°` : ""}.`,
  });
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function calendar(seed: number): Question {
  const r = rng(seed);
  const year = r.int(2001, 2030);
  const m1 = r.int(0, 5);
  const d1 = r.int(1, 28);
  const m2 = r.int(m1 + 1, 11);
  const d2 = r.int(1, 28);
  const t1 = Date.UTC(year, m1, d1);
  const t2 = Date.UTC(year, m2, d2);
  const day1 = new Date(t1).getUTCDay();
  const day2 = new Date(t2).getUTCDay();
  const diff = Math.round((t2 - t1) / 86400000);
  return mcq(r, {
    prompt: `If ${d1} ${MONTHS[m1]} ${year} was a ${DAYS[day1]}, what day of the week was ${d2} ${MONTHS[m2]} ${year}?`,
    correct: DAYS[day2],
    distractors: [DAYS[(day2 + 1) % 7], DAYS[(day2 + 6) % 7], DAYS[(day2 + 2) % 7]],
    explanation: `There are ${diff} days between the dates. ${diff} mod 7 = ${diff % 7} odd days, so move ${diff % 7} day(s) forward from ${DAYS[day1]} → ${DAYS[day2]}.`,
  });
}

const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
};

function ranking(seed: number): Question {
  const r = rng(seed);
  const name = r.pick(NAMES);
  const left = r.int(5, 25);
  const right = r.int(5, 25);
  const total = left + right - 1;
  return mcq(r, {
    prompt: `In a row of students, ${name} is ${ordinal(left)} from the left end and ${ordinal(right)} from the right end. How many students are there in the row?`,
    correct: `${total}`,
    distractors: [`${left + right}`, `${left + right + 1}`, `${total - 1}`, `${Math.abs(left - right) + 1}`],
    explanation: `${name} is counted in both positions, so total = ${left} + ${right} − 1 = ${total}.`,
  });
}

function oddOneOut(seed: number): Question {
  const r = rng(seed);
  const sets: { name: string; members: number[]; test: (n: number) => boolean }[] = [
    { name: "prime numbers", members: [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53], test: (n) => { for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return n > 1; } },
    { name: "perfect squares", members: [16, 25, 36, 49, 64, 81, 100, 121, 144, 169], test: (n) => Number.isInteger(Math.sqrt(n)) },
    { name: "multiples of 7", members: [14, 21, 28, 35, 42, 49, 56, 63, 77, 84], test: (n) => n % 7 === 0 },
    { name: "perfect cubes", members: [8, 27, 64, 125, 216, 343, 512, 729], test: (n) => Number.isInteger(Math.round(Math.cbrt(n))) && Math.round(Math.cbrt(n)) ** 3 === n },
  ];
  const set = r.pick(sets);
  const three = r.shuffle(set.members).slice(0, 3);
  let odd = r.int(10, 150);
  while (set.test(odd) || three.includes(odd)) odd++;
  return mcq(r, {
    prompt: `Find the odd one out:`,
    correct: `${odd}`,
    distractors: three.map(String),
    explanation: `${three.join(", ")} are all ${set.name}; ${odd} is not.`,
  });
}

/**
 * Linear seating arrangement. Picks a random order of 5 people, then adds clues one by one until
 * a brute-force solver over all 120 permutations finds exactly one order that fits.
 */
function seating(seed: number): Question {
  const r = rng(seed);
  const people = r.shuffle(NAMES).slice(0, 5);
  const truth = r.shuffle(people);
  const pos = (order: string[], p: string) => order.indexOf(p);
  type Clue = { text: string; ok: (o: string[]) => boolean };
  const makeClue = (rr: Rng): Clue => {
    const [x, y] = rr.shuffle(people);
    const t = (o: string[]) => [pos(o, x), pos(o, y)];
    const [px, py] = t(truth);
    const kind = rr.int(0, 4);
    if (kind === 0 && py === px + 1) return { text: `${y} sits immediately to the right of ${x}.`, ok: (o) => pos(o, y) === pos(o, x) + 1 };
    if (kind === 1 && Math.abs(px - py) === 2) return { text: `Exactly one person sits between ${x} and ${y}.`, ok: (o) => Math.abs(pos(o, x) - pos(o, y)) === 2 };
    if (kind === 2 && (px === 0 || px === 4)) return { text: `${x} sits at one of the ends.`, ok: (o) => pos(o, x) === 0 || pos(o, x) === 4 };
    if (kind === 3 && Math.abs(px - py) > 1) return { text: `${x} does not sit next to ${y}.`, ok: (o) => Math.abs(pos(o, x) - pos(o, y)) > 1 };
    if (kind === 4 && px < py) return { text: `${x} sits somewhere to the left of ${y}.`, ok: (o) => pos(o, x) < pos(o, y) };
    return makeClue(rr);
  };
  const perms: string[][] = [];
  const permute = (arr: string[], acc: string[]) => {
    if (!arr.length) perms.push(acc);
    arr.forEach((v, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...acc, v]));
  };
  permute(people, []);
  const clues: Clue[] = [];
  let candidates = perms;
  while (candidates.length > 1 && clues.length < 12) {
    const c = makeClue(r);
    const next = candidates.filter(c.ok);
    if (next.length < candidates.length) {
      clues.push(c);
      candidates = next;
    }
  }
  if (candidates.length !== 1) return seating(seed + 104729);
  const askPos = r.int(0, 4);
  const label = ["at the extreme left", "second from the left", "in the middle", "second from the right", "at the extreme right"][askPos];
  const ans = truth[askPos];
  return mcq(r, {
    prompt: `Five people — ${[...people].sort().join(", ")} — sit in a row facing north.\n${clues.map((c) => `• ${c.text}`).join("\n")}\nWho sits ${label}?`,
    correct: ans,
    distractors: people.filter((p) => p !== ans),
    explanation: `The only arrangement satisfying every clue (left → right) is: ${truth.join(", ")}. So ${ans} sits ${label}.`,
  });
}

const BLOOD = [
  { prompt: "Pointing to a man, {A} (a woman) said, “His mother is the only daughter of my mother.” How is {A} related to the man?", options: ["Mother", "Sister", "Aunt", "Grandmother"], answer: 0, explanation: "The only daughter of {A}'s mother is {A} herself. So {A} is the man's mother." },
  { prompt: "{A} is the brother of {B}. {B} is the sister of {C}. {C} is the father of {D}. How is {A} related to {D}?", options: ["Uncle", "Father", "Brother", "Cousin"], answer: 0, explanation: "{A}, {B} and {C} are siblings. {C} is {D}'s father, so {A} (male) is {D}'s uncle." },
  { prompt: "Introducing a boy, {A} (a man) said, “He is the son of the daughter of my father's only son.” How is the boy related to {A}?", options: ["Grandson", "Son", "Nephew", "Brother"], answer: 0, explanation: "{A}'s father's only son is {A} himself. The boy is the son of {A}'s daughter → grandson." },
  { prompt: "{A} is the mother of {B}. {B} is the sister of {C}. {D} is the son of {C}. How is {A} related to {D}?", options: ["Grandmother", "Mother", "Aunt", "Sister"], answer: 0, explanation: "{B} and {C} are {A}'s children; {D} is {C}'s son, so {A} is {D}'s grandmother." },
  { prompt: "If {A} is the husband of {B}, {C} is the daughter of {B}, and {D} is the brother of {C}, how is {D} related to {A}?", options: ["Son", "Brother", "Nephew", "Son-in-law"], answer: 0, explanation: "{C} and {D} are children of {A} and {B}. {D} is male, so {D} is {A}'s son." },
  { prompt: "{A} said, “{B}'s father is the only son of my mother.” How is {A} related to {B}? ({A} is a man.)", options: ["Father", "Uncle", "Brother", "Grandfather"], answer: 0, explanation: "The only son of {A}'s mother is {A}. So {A} is {B}'s father." },
  { prompt: "{A}'s mother is the sister of {B}'s father. How is {B} related to {A}?", options: ["Cousin", "Brother", "Nephew", "Uncle"], answer: 0, explanation: "{A}'s mother and {B}'s father are siblings, so {A} and {B} are cousins." },
];

function bloodRelationPuzzle(seed: number): Question {
  const r = rng(seed);
  const item = BLOOD[seed % BLOOD.length];
  // Letters, not names: the templates fix each person's gender, and a name could contradict it.
  const names = r.shuffle(["P", "Q", "R", "S", "T", "U"]);
  const fill = (s: string) => s.replace(/\{([A-F])\}/g, (_, k: string) => names[k.charCodeAt(0) - 65]);
  return staticMcq(r, { prompt: fill(item.prompt), options: item.options, answer: item.answer, explanation: fill(item.explanation) });
}

const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
const MALE_NAMES = ["Aman", "Chirag", "Farhan", "Harsh", "Jatin", "Laksh", "Rohan", "Vikram"];
const FEMALE_NAMES = ["Bela", "Divya", "Esha", "Gita", "Isha", "Kavya", "Meera", "Sana"];

/** Every 4th seed is a hand-written puzzle ("pointing to a photo…"); the rest are generated chains. */
function bloodRelations(seed: number): Question {
  if (seed % 4 === 0) return bloodRelationPuzzle(seed / 4);
  const r = rng(seed);
  for (;;) {
    const steps = Array.from({ length: r.int(2, 3) }, () => r.pick(["parent", "child", "sibling"] as const));
    const males = steps.map(() => r.next() < 0.5);
    const solved = solveChain(steps, males[0]);
    if (!solved) continue;
    // Each speaker's name must match the gender of their relation word; the last person can be anyone.
    const [m, f] = [r.shuffle(MALE_NAMES), r.shuffle(FEMALE_NAMES)];
    const names = [...steps.map((_, i) => (males[i] ? m.pop()! : f.pop()!)), r.pick([...m, ...f])];
    const lines = steps.map((st, i) => `${names[i]} is the ${STEP_WORDS[st][males[i] ? 0 : 1]} of ${names[i + 1]}.`);
    const [x, y] = [names[0], names[steps.length]];
    const pool = males[0] ? RELATION_WORDS.male : RELATION_WORDS.female;
    return mcq(r, {
      prompt: `${lines.join(" ")} How is ${x} related to ${y}?`,
      correct: cap(solved.relation),
      distractors: r.shuffle(pool.filter((w) => w !== solved.relation)).map(cap),
      explanation: `Draw the family tree one statement at a time: ${lines.join(" ")} Then ${x} ${RELATION_REASON[solved.key]} ${y}, so ${x} is ${y}'s ${solved.relation}.`,
    });
  }
}

const SYLL_OPTIONS = ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows", "Either I or II follows"];
const SYLL_TERMS = ["pens", "books", "tables", "cats", "dogs", "rats", "roses", "flowers", "phones", "laptops", "tablets", "teachers", "learners", "engineers", "artists", "servers", "machines", "rivers", "lakes", "ponds", "cars", "buses", "trucks", "fruits", "apples", "birds", "pets", "chairs", "desks", "coins", "notes", "keys", "locks"];

/**
 * Generated two-statement syllogism, solved exactly by checking every Venn diagram (see logic.ts).
 * Always five options, so the number of options never hints at "Either I or II".
 */
function syllogism(seed: number): Question {
  const r = rng(seed);
  const target = r.pick([0, 0, 1, 1, 2, 3, 3, 4]); // spread answers like real papers
  const form = (): Form => r.pick(["A", "A", "E", "I", "I", "O"] as const);
  const pair = (a: number, b: number) => (r.next() < 0.5 ? [a, b] : [b, a]);
  let best: { st: Prop[]; c: [Prop, Prop]; answer: number } | null = null;
  for (let tries = 0; tries < 300; tries++) {
    const [s1a, s1b] = pair(0, 1);
    const [s2a, s2b] = pair(1, 2);
    const st: Prop[] = [{ f: form(), s: s1a, p: s1b }, { f: form(), s: s2a, p: s2b }];
    const conc = () => {
      const [a, b] = r.pick([[0, 2], [2, 0], [0, 1], [1, 0], [1, 2], [2, 1]]);
      return { f: form(), s: a, p: b };
    };
    const c: [Prop, Prop] = [conc(), conc()];
    const same = (x: Prop, y: Prop) => x.f === y.f && x.s === y.s && x.p === y.p;
    if (same(c[0], c[1]) || c.some((x) => st.some((y) => same(x, y)))) continue;
    try {
      const answer = solveSyllogism(st, c[0], c[1]);
      if (!best || answer === target) best = { st, c, answer };
      if (answer === target) break;
    } catch {
      // contradictory statements cannot happen with two premises over three terms, but stay safe
    }
  }
  const { st, c, answer } = best!;
  const terms = r.shuffle(SYLL_TERMS).slice(0, 3);
  const [c1, c2] = c.map((x) => sentence(x, terms));
  const verdict = (i: 0 | 1) => (answer === 2 || answer === i ? "must be true in every Venn diagram that fits both statements" : "is not certain: the statements allow a diagram where it is false");
  return {
    kind: "mcq",
    prompt: `Statements:\n1. ${sentence(st[0], terms)}\n2. ${sentence(st[1], terms)}\nConclusions:\nI. ${c1}\nII. ${c2}\nWhich conclusion(s) logically follow?`,
    options: SYLL_OPTIONS,
    answer,
    explanation:
      answer === 4
        ? `Neither conclusion is certain on its own, but they are exact opposites about the same groups, so in every possible diagram exactly one of them is true.`
        : `Conclusion I (“${c1}”) ${verdict(0)}. Conclusion II (“${c2}”) ${verdict(1)}. Draw three overlapping circles and try to break each conclusion.`,
  };
}

const DATA_SUFF = [
  { q: "What is the value of x?", s1: "x + y = 10", s2: "x − y = 4", answer: 2, why: "Neither alone fixes x, but together they give x = 7." },
  { q: "Is the integer n even?", s1: "3n is even.", s2: "n + 2 is odd.", answer: 3, why: "If 3n is even, n is even (3 is odd). If n + 2 is odd, n is odd — that also answers the question. Each alone is sufficient." },
  { q: "How old is Riya?", s1: "Riya is 5 years older than Sam.", s2: "Sam is half of Riya's age.", answer: 2, why: "Together: R = S + 5 and S = R/2 → R = 10. Neither alone is enough." },
  { q: "What is the area of the rectangle?", s1: "Its perimeter is 20 cm.", s2: "Its diagonal is √50 cm.", answer: 2, why: "l + w = 10 and l² + w² = 50 → lw = 25. Both are needed." },
  { q: "On which day of the week was Tara born?", s1: "Her brother was born on a Monday, two days after her.", s2: "Tara is older than her brother.", answer: 0, why: "Statement I alone gives Saturday. Statement II alone gives nothing." },
  { q: "Is x > y?", s1: "x = 2y", s2: "y > 0", answer: 2, why: "x = 2y alone fails for negative y. With y > 0, x = 2y > y. Both are required." },
  { q: "What is the price of one pen?", s1: "3 pens and 2 pencils cost ₹40.", s2: "A pencil costs ₹5.", answer: 2, why: "Together: 3p + 10 = 40 → p = 10. Neither alone suffices." },
  { q: "How many students are in the class?", s1: "Asha is 12th from the top.", s2: "Asha is 19th from the bottom.", answer: 2, why: "Together: 12 + 19 − 1 = 30. Neither alone tells the total." },
  { q: "Is the number N divisible by 6?", s1: "N is divisible by 3.", s2: "N is divisible by 4.", answer: 2, why: "Divisible by 3 and by 4 → divisible by 12, hence by 6. Divisible by only one of them is not enough." },
  { q: "What is the speed of the train?", s1: "It crosses a 200 m platform in 20 s.", s2: "It crosses a pole in 10 s.", answer: 2, why: "Let length L, speed v: L = 10v and L + 200 = 20v → v = 20 m/s. Both needed." },
];
const DS_OPTIONS = [
  "Statement I alone is sufficient",
  "Statement II alone is sufficient",
  "Both statements together are needed",
  "Each statement alone is sufficient",
  "Both together are not sufficient",
];

function dataSufficiency(seed: number): Question {
  const item = DATA_SUFF[seed % DATA_SUFF.length];
  return {
    kind: "mcq",
    prompt: `${item.q}\nI. ${item.s1}\nII. ${item.s2}`,
    options: DS_OPTIONS,
    answer: item.answer,
    explanation: item.why,
  };
}

export const reasoningTopics: Topic[] = [
  { id: "r-seating", section: "reasoning", label: "Seating Arrangement", weight: 3, targetSec: 150, generate: seating },
  { id: "r-syllogism", section: "reasoning", label: "Syllogisms", weight: 3, targetSec: 75, generate: syllogism },
  { id: "r-series", section: "reasoning", label: "Number Series", weight: 2, targetSec: 75, generate: numberSeries },
  { id: "r-coding", section: "reasoning", label: "Coding–Decoding", weight: 2, targetSec: 75, generate: codingDecoding },
  { id: "r-blood", section: "reasoning", label: "Blood Relations", weight: 2, targetSec: 90, generate: bloodRelations },
  { id: "r-direction", section: "reasoning", label: "Direction Sense", weight: 1, targetSec: 90, generate: directions },
  { id: "r-clock", section: "reasoning", label: "Clocks", weight: 1, targetSec: 75, generate: clocks },
  { id: "r-calendar", section: "reasoning", label: "Calendars", weight: 1, targetSec: 90, generate: calendar },
  { id: "r-ranking", section: "reasoning", label: "Ranking & Order", weight: 1, targetSec: 45, generate: ranking },
  { id: "r-odd", section: "reasoning", label: "Odd One Out", weight: 1, targetSec: 45, generate: oddOneOut },
  { id: "r-ds", section: "reasoning", label: "Data Sufficiency", weight: 2, targetSec: 90, poolSize: DATA_SUFF.length, generate: dataSufficiency },
];
