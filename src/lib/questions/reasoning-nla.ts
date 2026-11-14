/**
 * Reasoning types reported in the Deloitte NLA (Cyber Gurukul · Analyst Trainee) paper that the
 * Infosys-style generators did not cover: letter-based puzzles (alphabetical rearrangement, letter
 * pairs, letter series, counting in a digit string, alphabet positions) and statement-based logic
 * (three-statement truth, statement & assumptions, statement & conclusions). Original items.
 */
import { mcq, rng, type Rng } from "./rng";
import type { Question, Topic } from "./types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const pos = (c: string) => ALPHABET.indexOf(c) + 1;
const at = (n: number) => ALPHABET[(((n - 1) % 26) + 26) % 26];
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

const WORDS = [
  "TABULAR", "SPECTATOR", "COMPUTER", "MANAGER", "PROBLEM", "NETWORK", "FORMULA", "JOURNEY", "MONITOR", "DISPLAY",
  "SECURITY", "ANALYST", "CAPITAL", "HARMONY", "VILLAGE", "TRAVEL", "GARDEN", "PLASTIC", "MARKET", "BRIDGE",
  "SILVER", "ORANGE", "PLANET", "FLOWER", "SCHOOL", "PENCIL", "DOCTOR", "LAPTOP", "WINDOW", "BUTTON",
  "CREATION", "DOCUMENT", "KEYBOARD", "STRANGER", "PRINTER", "HOSPITAL", "QUESTION", "MACHINE",
];

/** Pairs (i < j) whose alphabet distance equals their distance in the word, in either direction. */
export function letterPairs(word: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < word.length; i++) for (let j = i + 1; j < word.length; j++) if (Math.abs(pos(word[j]) - pos(word[i])) === j - i) out.push(word[i] + word[j]);
  return out;
}
const PAIR_WORDS = WORDS.filter((w) => letterPairs(w).length <= 5);

function alphabetical(r: Rng): Question {
  const w = r.pick(WORDS);
  const sorted = [...w].sort();
  const fromRight = r.int(0, 1) === 1;
  const n = r.int(2, w.length - 1);
  const correct = sorted[fromRight ? w.length - n : n - 1];
  const distractors = r.shuffle([...new Set(sorted)].filter((c) => c !== correct)).slice(0, 3);
  return mcq(
    r,
    {
      prompt: `The letters of the word ${w} are rearranged in alphabetical order. Which letter is ${ordinal(n)} from the ${fromRight ? "right" : "left"}?`,
      correct,
      distractors,
      explanation: `In alphabetical order the letters are ${sorted.join(" ")}. Counting from the ${fromRight ? "right" : "left"}, the ${ordinal(n)} letter is ${correct}.`,
    },
    (i) => at(pos(correct) + i),
  );
}

function pairs(r: Rng): Question {
  const w = r.pick(PAIR_WORDS);
  const found = letterPairs(w);
  const correct = String(found.length);
  const distractors = r.shuffle([0, 1, 2, 3, 4, 5, 6].filter((k) => k !== found.length).map(String)).slice(0, 3);
  return mcq(r, {
    prompt: `How many pairs of letters in the word ${w} have as many letters between them in the word as there are between them in the English alphabet (in either direction)?`,
    correct,
    distractors,
    explanation: found.length ? `The pairs are ${found.join(", ")}: ${found.length} in all.` : "No pair of letters satisfies the condition.",
  });
}

function letterSeries(r: Rng): Question {
  const len = r.int(2, 3);
  const shifts = Array.from({ length: len }, () => r.pick([-3, -2, -1, 1, 2, 3]));
  const start = Array.from({ length: len }, () => r.int(1, 26));
  const term = (k: number, tweak: number[] = []) => start.map((s, p) => at(s + k * shifts[p] + (tweak[p] ?? 0))).join("");
  const terms = [0, 1, 2, 3, 4].map((k) => term(k));
  const correct = term(5);
  const tweakFirst = Array.from({ length: len }, (_, p) => (p === 0 ? 1 : 0));
  const tweakLast = Array.from({ length: len }, (_, p) => (p === len - 1 ? -1 : 0));
  return mcq(r, {
    prompt: `Find the next term of the series: ${terms.join(", ")}, ?`,
    correct,
    distractors: [term(5, tweakFirst), term(5, tweakLast), term(6)],
    explanation: `In each term, ${shifts.map((s, p) => `letter ${p + 1} moves ${s > 0 ? `+${s}` : s}`).join(", ")}. After ${terms[4]} comes ${correct}.`,
  });
}

function digitCount(r: Rng): Question {
  const digits = Array.from({ length: 20 }, () => r.int(3, 8));
  const [x, y, z] = r.shuffle([3, 4, 5, 6, 7, 8]).slice(0, 3);
  const both = r.int(0, 1) === 1;
  // Plant the pattern a few times, otherwise the answer is almost always 0.
  for (let k = r.int(1, 3); k > 0; k--) {
    const i = r.int(1, digits.length - 2);
    [digits[i - 1], digits[i], digits[i + 1]] = [both ? y : digits[i - 1], x, z];
  }
  const hits: number[] = [];
  for (let i = 1; i < digits.length - 1; i++) if (digits[i] === x && (both ? digits[i - 1] === y && digits[i + 1] === z : digits[i + 1] === z)) hits.push(i + 1);
  const correct = String(hits.length);
  return mcq(r, {
    prompt: `In the sequence below, how many ${x}s are ${both ? `immediately preceded by ${y} and immediately followed by ${z}` : `immediately followed by ${z}`}?`,
    code: digits.join(" "),
    correct,
    distractors: r.shuffle([0, 1, 2, 3, 4, 5].filter((k) => k !== hits.length).map(String)).slice(0, 3),
    explanation: hits.length ? `Such ${x}s occur at position${hits.length > 1 ? "s" : ""} ${hits.join(", ")} (counting from the left): ${hits.length} in all.` : `No ${x} in the sequence satisfies the condition.`,
  });
}

function alphabetPosition(r: Rng): Question {
  const k = r.int(3, 12);
  const n = r.int(2, 8);
  const fromRight = r.int(0, 1) === 1;
  // k-th from the right is letter 27−k; then move n to the left. From the left: letter k, move n to the right.
  const target = fromRight ? 27 - k - n : k + n;
  const correct = at(target);
  return mcq(
    r,
    {
      prompt: fromRight
        ? `Which letter is ${ordinal(n)} to the left of the ${ordinal(k)} letter from the right end of the English alphabet?`
        : `Which letter is ${ordinal(n)} to the right of the ${ordinal(k)} letter from the left end of the English alphabet?`,
      correct,
      distractors: [at(target + 1), at(target - 1), at(fromRight ? 27 - k + n : k - n)],
      explanation: fromRight
        ? `The ${ordinal(k)} letter from the right is ${at(27 - k)} (position ${27 - k}). ${n} to its left is position ${target}: ${correct}.`
        : `The ${ordinal(k)} letter from the left is ${at(k)}. ${n} to its right is position ${target}: ${correct}.`,
    },
    (i) => at(target + i + 1),
  );
}

function letters(seed: number): Question {
  const r = rng(seed);
  const kind = r.int(0, 4);
  return kind === 0 ? alphabetical(r) : kind === 1 ? pairs(r) : kind === 2 ? letterSeries(r) : kind === 3 ? digitCount(r) : alphabetPosition(r);
}

// ─── Statements ──────────────────────────────────────────────────────────────

const NAMES = ["Aman", "Bela", "Chirag", "Divya", "Esha", "Farhan", "Gita", "Harsh", "Isha", "Jatin"];
const RELATIONS: [more: string, less: string][] = [
  ["is taller than", "is shorter than"],
  ["is older than", "is younger than"],
  ["is heavier than", "is lighter than"],
  ["scored more marks than", "scored fewer marks than"],
  ["earns more than", "earns less than"],
];
const TRUTH_OPTIONS = ["True", "False", "Uncertain", "The first two statements contradict each other"];

/**
 * Given facts "a > b" (first two statements), is the claim "c > d" true, false or uncertain?
 * Checks every total order of the three people that satisfies the facts.
 */
export function verdict(facts: [string, string][], claim: [string, string]): "True" | "False" | "Uncertain" {
  const people = [...new Set(facts.flat())];
  const orders: string[][] = [];
  const permute = (rest: string[], acc: string[]) => (rest.length ? rest.forEach((p) => permute(rest.filter((q) => q !== p), [...acc, p])) : orders.push(acc));
  permute(people, []);
  const consistent = orders.filter((o) => facts.every(([a, b]) => o.indexOf(a) < o.indexOf(b))); // earlier = greater
  const holds = consistent.map((o) => o.indexOf(claim[0]) < o.indexOf(claim[1]));
  return holds.every(Boolean) ? "True" : holds.some(Boolean) ? "Uncertain" : "False";
}

function threeStatements(r: Rng): Question {
  const [x, y, z] = r.shuffle(NAMES).slice(0, 3);
  const [more, less] = r.pick(RELATIONS);
  // Chain (x > y > z) half the time, so true/false and uncertain verdicts are balanced.
  const shape = r.int(0, 3) === 0 ? 1 + r.int(0, 1) : 0;
  const facts: [string, string][] = shape === 0 ? [[x, y], [y, z]] : shape === 1 ? [[x, y], [x, z]] : [[x, z], [y, z]];
  // Ask about the one pair the first two statements do not compare directly.
  const stated = new Set(facts.flatMap(([a, b]) => [a + b, b + a]));
  const claim = r.pick(([[x, y], [y, x], [x, z], [z, x], [y, z], [z, y]] as [string, string][]).filter(([a, b]) => !stated.has(a + b)));
  const say = ([a, b]: [string, string]) => (r.int(0, 1) ? `${a} ${more} ${b}.` : `${b} ${less} ${a}.`);
  const answer = verdict(facts, claim);
  return {
    kind: "mcq",
    prompt: `${say(facts[0])} ${say(facts[1])} ${say(claim)}\nIf the first two statements are true, the third statement is:`,
    options: TRUTH_OPTIONS,
    answer: TRUTH_OPTIONS.indexOf(answer),
    explanation:
      answer === "Uncertain"
        ? `The first two statements do not compare ${claim[0]} and ${claim[1]} with each other, so the third statement cannot be decided.`
        : `From the first two statements, ${facts.map(([a, b]) => `${a} > ${b}`).join(" and ")}, so ${claim[0]} > ${claim[1]} is ${answer.toLowerCase()}.`,
  };
}

type Pair = { statement: string; i: string; ii: string; answer: number; explanation: string };
const ASSUMPTION_OPTIONS = ["Only assumption I is implicit", "Only assumption II is implicit", "Either I or II is implicit", "Neither I nor II is implicit", "Both I and II are implicit"];
const CONCLUSION_OPTIONS = ["Only conclusion I follows", "Only conclusion II follows", "Either I or II follows", "Neither I nor II follows", "Both I and II follow"];
const ONLY_I = 0, ONLY_II = 1, NEITHER = 3, BOTH = 4;

const ASSUMPTIONS: Pair[] = [
  { statement: "“Use our toothpaste for whiter teeth within a week.” — an advertisement.", i: "People want whiter teeth.", ii: "No other toothpaste can whiten teeth.", answer: ONLY_I, explanation: "An advertisement assumes the audience wants what it promises (I). It does not assume that competitors cannot do the same (II)." },
  { statement: "“Apply early; seats are limited.” — a notice for a training course.", i: "The number of applicants may exceed the number of seats.", ii: "Late applicants will be given seats first.", answer: ONLY_I, explanation: "Urging early application assumes demand may exceed seats (I). II contradicts the notice." },
  { statement: "The manager asked the team to submit the report by Friday evening.", i: "The team can finish the report by Friday evening.", ii: "The manager will be on leave on Friday.", answer: ONLY_I, explanation: "Setting a deadline assumes it can be met (I). Nothing in the statement suggests II." },
  { statement: "“Switch off the lights when you leave the room.” — a notice in an office.", i: "Employees sometimes leave the lights on when they leave.", ii: "Employees leave the room only in the evening.", answer: ONLY_I, explanation: "The notice exists because lights are sometimes left on (I). II is not assumed." },
  { statement: "Despite the heavy rain, the match will be played as scheduled.", i: "The ground can be made fit for play despite the rain.", ii: "Spectators will not come if it rains.", answer: ONLY_I, explanation: "Deciding to play assumes the ground will be playable (I). II is irrelevant to the decision." },
  { statement: "“Want to speak English fluently? Join our weekend classes.” — an advertisement.", i: "Weekend classes can improve spoken English.", ii: "Nobody can speak English fluently without attending classes.", answer: ONLY_I, explanation: "The offer assumes the classes help (I). II is an extreme claim the advertisement does not rely on." },
  { statement: "The government has banned plastic bags thinner than 50 microns.", i: "Thinner plastic bags cause more harm than thicker ones.", ii: "Shopkeepers will stop using plastic bags of every kind.", answer: ONLY_I, explanation: "Banning only thin bags assumes they are the bigger problem (I). II goes beyond the ban." },
  { statement: "“Carry your admit card to enter the examination hall.” — an instruction to candidates.", i: "Candidates without an admit card may not be allowed in.", ii: "The admit card helps verify who the candidate is.", answer: BOTH, explanation: "The instruction assumes the card is required for entry (I) and that it serves to identify the candidate (II)." },
  { statement: "The company offers a referral bonus to employees who bring in new hires.", i: "Employees know people who may be suitable for the company.", ii: "Every referred candidate will be selected.", answer: ONLY_I, explanation: "A referral scheme assumes employees can refer suitable people (I). It does not assume all referrals succeed (II)." },
  { statement: "“Water supply will be cut on Sunday from 10 am to 2 pm for pipeline repairs.” — a municipal notice.", i: "Residents are inconvenienced less by a Sunday cut than by a weekday cut.", ii: "The repairs can be completed within four hours.", answer: BOTH, explanation: "Choosing Sunday assumes I; announcing a four-hour window assumes II." },
  { statement: "“Even a small donation can feed a child for a day.” — a charity appeal.", i: "People are willing to donate small amounts.", ii: "A day's food for a child costs little.", answer: BOTH, explanation: "The appeal targets small donors (I) and claims a small amount is enough for a day's food (II)." },
  { statement: "The principal warned that latecomers will not be allowed into the morning assembly.", i: "Some students come late to the assembly.", ii: "Students want to attend the morning assembly.", answer: BOTH, explanation: "A warning assumes the problem exists (I) and that exclusion is a deterrent, which needs II." },
  { statement: "“Buy two shirts and get one free!” — a shop banner.", i: "Offers of free items attract customers.", ii: "The shirts are of poor quality.", answer: ONLY_I, explanation: "The offer assumes it will attract buyers (I). Quality is not assumed either way (II)." },
  { statement: "The airline has introduced a direct flight between Kolkata and Bhubaneswar.", i: "There are enough passengers on this route to fill the flight.", ii: "Trains between the two cities are always late.", answer: ONLY_I, explanation: "Starting a route assumes demand (I). II is not assumed by the decision." },
];

const CONCLUSIONS: Pair[] = [
  { statement: "All employees who completed the security training received a certificate. Rahul received a certificate.", i: "Rahul completed the security training.", ii: "Everyone who holds a certificate completed the training.", answer: NEITHER, explanation: "Certificates may be given for other reasons too, so neither conclusion follows from “all who trained got one”." },
  { statement: "The office canteen now serves only vegetarian food.", i: "Non-vegetarian food is no longer available in the office canteen.", ii: "Most employees are vegetarian.", answer: ONLY_I, explanation: "I restates the statement. The reason for the change is not given, so II does not follow." },
  { statement: "Road accidents in the city rose by 20% this year, while the number of vehicles rose by 30%.", i: "The increase in vehicles is a possible reason for the rise in accidents.", ii: "Every new vehicle causes an accident.", answer: ONLY_I, explanation: "I is a reasonable possibility suggested by the data. II is an absurd overstatement." },
  { statement: "No student of this college has failed the campus test in the last three years.", i: "The college prepares its students very well for campus tests.", ii: "Every student of this college who took the campus test in the last three years passed it.", answer: ONLY_II, explanation: "II is exactly what the statement says. I is a possible explanation, not a conclusion that must be true." },
  { statement: "Some laptops in the lab are not working. All laptops in the lab are of brand X.", i: "Some brand X laptops are not working.", ii: "Brand X laptops are unreliable.", answer: ONLY_I, explanation: "The non-working laptops are brand X, so I follows. A few faulty units do not prove II." },
  { statement: "Every applicant must hold a degree in computer science or information technology. Priya, an applicant, holds a degree in mechanical engineering.", i: "Priya's application does not meet the requirement.", ii: "Priya cannot get any job in the company.", answer: ONLY_I, explanation: "I follows directly. The statement is about this requirement only, so II does not follow." },
  { statement: "Train 12345 is running two hours late today because of fog.", i: "Fog can delay trains.", ii: "Train 12345 is always late in winter.", answer: ONLY_I, explanation: "The statement gives fog as the cause, so I follows. One delay does not establish II." },
  { statement: "Either the server was overloaded or the network cable was faulty. The cable was tested and found to be fine.", i: "The server was overloaded.", ii: "The cable was faulty.", answer: ONLY_I, explanation: "With one alternative ruled out, the other must hold: I follows and II is ruled out." },
  { statement: "Mohan scored more than Sita. Sita scored more than Ravi.", i: "Mohan scored more than Ravi.", ii: "Ravi scored the lowest in the class.", answer: ONLY_I, explanation: "I follows by transitivity. Other students' scores are unknown, so II does not follow." },
  { statement: "The library will stay open till 10 pm during the examination week.", i: "Students use the library more during examinations.", ii: "The library closes before 10 pm during the rest of the year.", answer: BOTH, explanation: "Extending the hours only for exam week implies both the extra demand (I) and the usual earlier closing (II)." },
  { statement: "Only members can borrow books from the club library. Anita borrowed a book from the club library.", i: "Anita is a member of the club.", ii: "Anita reads a lot of books.", answer: ONLY_I, explanation: "Borrowing requires membership, so I follows. II is not supported." },
  { statement: "The company's profit fell this year even though its sales revenue increased.", i: "The company's costs rose by more than its revenue did.", ii: "The company will make a loss next year.", answer: ONLY_I, explanation: "Profit is revenue minus costs; higher revenue with lower profit means costs rose more (I). II is a guess." },
];

const bankQuestion = (prefix: string, items: Pair[], options: string[], index: number, roman: [string, string]): Question => {
  const item = items[index % items.length];
  return {
    kind: "mcq",
    prompt: `Statement: ${item.statement}\n${roman[0]}: ${item.i}\n${roman[1]}: ${item.ii}\n${prefix}`,
    options,
    answer: item.answer,
    explanation: item.explanation,
  };
};

function statements(seed: number): Question {
  const kind = seed % 3;
  const index = Math.floor(seed / 3);
  if (kind === 0) return threeStatements(rng(seed));
  if (kind === 1) return bankQuestion("Which assumption is implicit in the statement?", ASSUMPTIONS, ASSUMPTION_OPTIONS, index, ["Assumption I", "Assumption II"]);
  return bankQuestion("Which conclusion follows from the statement?", CONCLUSIONS, CONCLUSION_OPTIONS, index, ["Conclusion I", "Conclusion II"]);
}

export const nlaReasoningTopics: Topic[] = [
  { id: "r-alpha", section: "reasoning", label: "Alphabet & Letter Series", weight: 2, targetSec: 60, generate: letters },
  { id: "r-statement", section: "reasoning", label: "Statements, Assumptions & Conclusions", weight: 2, targetSec: 60, generate: statements },
];
