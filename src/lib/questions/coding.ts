/**
 * Coding–decoding. Many rule families (standard tier) plus word-level and two-step codes (hard tier).
 *
 * Every question is checked for ambiguity: all rules in the catalogue that also turn the example word
 * into the given code must encode the asked word the same way, otherwise new words are drawn.
 * Wrong options are what the other, plausible-looking rules would give.
 */
import { mcq, rng, type Rng } from "./rng";
import type { Question } from "./types";

const WORDS = [
  "CAT", "DOG", "PEN", "SUN", "MAP", "BOX",
  "MILK", "BOOK", "LAMP", "FISH", "CODE", "DESK", "GOLD", "ROSE", "TREE", "WIND", "SALT", "KING", "RAIN", "STAR", "BIRD", "SHIP",
  "TABLE", "WATER", "LIGHT", "MONEY", "PLANT", "CHAIR", "BRAIN", "SMART", "CLOUD", "TIGER", "GRAPE", "STONE",
  "MOTHER", "SCHOOL", "PENCIL", "GARDEN", "SILVER", "ORANGE", "PLANET", "MARKET", "BRIDGE", "FLOWER",
];
const pos = (c: string) => c.charCodeAt(0) - 64; // A = 1
const chr = (n: number) => String.fromCharCode(((((n - 1) % 26) + 26) % 26) + 65);
const shift = (c: string, k: number) => chr(pos(c) + k);

type Rule = { id: string; family: string; text: string; enc: (w: string) => string };
const signed = (k: number) => (k > 0 ? `+${k}` : k < 0 ? `−${-k}` : "0");
const VOWEL = new Set(["A", "E", "I", "O", "U"]);
const then = (k: number) => (k ? `, then each letter moves ${signed(k)}` : "");

/**
 * Every rule the generator knows, grouped into families (the question "types" students see). Families
 * are drawn evenly, so a +1/+2/+3 code is no more likely than an opposite-letter or number code.
 * The whole catalogue is also used to reject ambiguous examples.
 */
function catalogue(): Rule[] {
  const out: Rule[] = [];
  const add = (family: string, id: string, text: string, enc: (w: string) => string) => out.push({ id, family, text, enc });
  for (const k of [-4, -3, -2, -1, 1, 2, 3, 4]) add("shift", `shift${k}`, `each letter moves ${signed(k)}`, (w) => [...w].map((c) => shift(c, k)).join(""));
  for (const k of [0, 1, -1, 2]) add("opposite", `opposite${k}`, `each letter is replaced by its opposite letter (A↔Z, B↔Y, C↔X …)${then(k)}`, (w) => [...w].map((c) => shift(chr(27 - pos(c)), k)).join(""));
  for (const k of [0, 1, 2, -1]) add("reverse", `rev${k}`, k ? `the word is written backwards${then(k)}` : "the word is written backwards", (w) => [...w].reverse().map((c) => shift(c, k)).join(""));
  for (const [a, d] of [[1, 1], [-1, -1], [2, 2], [1, 2], [0, 1], [3, -1]]) {
    add("growing", `grow${a},${d}`, `the shift changes with position: ${[0, 1, 2, 3].map((i) => signed(a + d * i)).join(", ")}, …`, (w) => [...w].map((c, i) => shift(c, a + d * i)).join(""));
  }
  for (const k of [1, 2, 3]) add("alternate", `alt${k}`, `letters move ${signed(k)} and ${signed(-k)} alternately`, (w) => [...w].map((c, i) => shift(c, i % 2 ? -k : k)).join(""));
  const halves = (w: string) => {
    const h = Math.floor(w.length / 2);
    return [w.slice(0, h), w.slice(h, w.length - h), w.slice(w.length - h)];
  };
  for (const k of [0, 1, 2]) {
    add("halves", `halves${k}`, `the two halves of the word swap places${then(k)}`, (w) => {
      const [a, m, b] = halves(w);
      return [...(b + m + a)].map((c) => shift(c, k)).join("");
    });
    add("half-reverse", `halfrev${k}`, `each half of the word is written backwards in place (COMPUTER → PMOCRETU)${then(k)}`, (w) => {
      const [a, m, b] = halves(w);
      return [...([...a].reverse().join("") + m + [...b].reverse().join(""))].map((c) => shift(c, k)).join("");
    });
  }
  for (const k of [0, 1]) {
    add("pairs", `pairs${k}`, `each pair of neighbouring letters swaps places (1st↔2nd, 3rd↔4th, …)${then(k)}`, (w) => {
      const a = [...w];
      for (let i = 0; i + 1 < a.length; i += 2) [a[i], a[i + 1]] = [a[i + 1], a[i]];
      return a.map((c) => shift(c, k)).join("");
    });
  }
  for (const k of [0, 1, -1]) {
    add("rotate", `rotL${k}`, `the first letter moves to the end${then(k)}`, (w) => [...(w.slice(1) + w[0])].map((c) => shift(c, k)).join(""));
    add("rotate", `rotR${k}`, `the last letter moves to the front${then(k)}`, (w) => [...(w.at(-1) + w.slice(0, -1))].map((c) => shift(c, k)).join(""));
  }
  for (const [v, c] of [[1, -1], [-1, 1], [2, 1], [1, 2]]) {
    add("vowels", `vc${v},${c}`, `vowels move ${signed(v)} and consonants move ${signed(c)}`, (w) => [...w].map((ch) => shift(ch, VOWEL.has(ch) ? v : c)).join(""));
  }
  add("numbers", "posnum", "each letter is replaced by its position in the alphabet (A = 1 … Z = 26), written one after another", (w) => [...w].map((c) => pos(c)).join(""));
  add("numbers", "revnum", "each letter is replaced by its position counted from Z (A = 26 … Z = 1), written one after another", (w) => [...w].map((c) => 27 - pos(c)).join(""));
  add("numbers", "posnum1", "each letter is replaced by its alphabet position + 1, written one after another", (w) => [...w].map((c) => pos(c) + 1).join(""));
  return out;
}
const RULES = catalogue();
const FAMILIES = [...new Set(RULES.map((x) => x.family))];

/** Two words with no letter coincidences that would make the rule unreadable, and an unambiguous answer. */
function pickPair(r: Rng, rule: Rule, sameLength: boolean) {
  for (let i = 0; i < 300; i++) {
    const [w1, w2] = r.shuffle(WORDS);
    if (w1 === w2 || (sameLength && w1.length !== w2.length)) continue;
    if (rule.enc(w1) === w1) continue; // e.g. reversing a palindrome shows nothing
    const code = rule.enc(w1);
    const consistent = RULES.filter((x) => x.enc(w1) === code);
    if (new Set(consistent.map((x) => x.enc(w2))).size === 1) return { w1, w2, code };
  }
  return null;
}

/** Wrong options: what other rules that look similar would give for the asked word. */
function decoys(r: Rng, rule: Rule, w2: string, ans: string): string[] {
  const near = RULES.filter((x) => x.id !== rule.id && x.family === rule.family);
  const others = r.shuffle(RULES.filter((x) => x.id !== rule.id));
  return [...r.shuffle(near), ...others].map((x) => x.enc(w2)).filter((c) => c !== ans);
}

/** "If water is called food, food is called tree…": the answer is the new name of the real thing. */
const THINGS = [
  { word: "water", ask: "What do we drink?" },
  { word: "food", ask: "What do we eat?" },
  { word: "chair", ask: "What do we sit on?" },
  { word: "pen", ask: "What do we write with?" },
  { word: "bed", ask: "What do we sleep on?" },
  { word: "sky", ask: "Where do aeroplanes fly?" },
  { word: "sun", ask: "What gives us light during the day?" },
  { word: "book", ask: "What do we read?" },
  { word: "shoe", ask: "What do we wear on our feet?" },
  { word: "key", ask: "What do we open a lock with?" },
];
function substitution(r: Rng): Question {
  const pick = r.shuffle(THINGS).slice(0, r.int(5, 6));
  const ring = pick.map((t, i) => [t.word, pick[(i + 1) % pick.length].word] as const); // X is called Y
  const target = r.pick(pick);
  const ans = ring.find(([x]) => x === target.word)![1];
  const calledTarget = ring.find(([, y]) => y === target.word)![0];
  return mcq(r, {
    prompt: `In a certain language, ${ring.map(([x, y]) => `'${x}' is called '${y}'`).join(", ")}. ${target.ask}`,
    correct: ans,
    distractors: [target.word, calledTarget, ...r.shuffle(pick.map((t) => t.word).filter((w) => w !== ans && w !== target.word && w !== calledTarget))],
    explanation: `In real life the answer is '${target.word}', but in this language '${target.word}' is called '${ans}'. Traps: answering '${target.word}' (the real word) or '${calledTarget}' (the word that is called '${target.word}').`,
  });
}

export function codingDecoding(seed: number): Question {
  const r = rng(seed);
  // Every family (plus word substitution) is equally likely.
  const k = r.int(0, FAMILIES.length);
  if (k === FAMILIES.length) return substitution(r);
  const family = FAMILIES[k];
  for (;;) {
    const rule = r.pick(RULES.filter((x) => x.family === family));
    const pair = pickPair(r, rule, false);
    if (!pair) continue;
    const ans = rule.enc(pair.w2);
    return mcq(r, {
      prompt: `In a certain code language, ${pair.w1} is written as ${pair.code}. How is ${pair.w2} written in that code?`,
      correct: ans,
      distractors: decoys(r, rule, pair.w2, ans),
      explanation: `Compare ${pair.w1} with ${pair.code}: ${rule.text}. Applying the same rule to ${pair.w2} gives ${ans}.`,
    });
  }
}

// ── Hard tier ───────────────────────────────────────────────────────────────

const VOCAB = ["sky", "is", "blue", "red", "rose", "grows", "fast", "green", "tree", "very", "tall", "birds", "fly", "high", "sun", "shines", "bright", "river", "flows", "slowly"];
const SYLL = ["ka", "la", "ma", "pa", "ta", "ri", "so", "ne", "du", "vi", "po", "zu", "fe", "mo", "gi", "ru"];

/** Sentence codes: words map to code words; find one word's code by comparing sentences. */
function sentenceCode(r: Rng): Question {
  for (;;) {
    const words = r.shuffle(VOCAB).slice(0, 6);
    const codes = r.shuffle(SYLL).slice(0, 6);
    const code = new Map(words.map((w, i) => [w, codes[i]]));
    // Three sentences of 3 words; the target word must be pinned down by the sentences given.
    const s = [r.shuffle(words.slice(0, 4)).slice(0, 3), r.shuffle(words.slice(1, 5)).slice(0, 3), r.shuffle(words.slice(2, 6)).slice(0, 3)];
    if (new Set(s.map((x) => [...x].sort().join())).size < 3) continue;
    const target = r.pick(words);
    // Brute force: every word→code assignment consistent with the shown sentences (codes shuffled within each sentence).
    const shown = s.map((sent) => r.shuffle(sent.map((w) => code.get(w)!)));
    const appears = words.filter((w) => s.some((x) => x.includes(w)));
    if (!appears.includes(target)) continue;
    const possible = codes.filter((c) => s.every((sent, i) => sent.includes(target) === shown[i].includes(c)));
    // Only codes that appear exactly where the target appears are possible; also require the assignment to be forced.
    if (possible.length !== 1) continue;
    const ans = possible[0];
    const fmt = (sent: string[], i: number) => `"${sent.join(" ")}" is written as "${shown[i].join(" ")}"`;
    const wrong = codes.filter((c) => c !== ans && shown.some((x, i) => x.includes(c) && s[i].includes(target)));
    return mcq(r, {
      prompt: `In a certain code language:\n${s.map(fmt).join(";\n")}.\nWhat is the code for "${target}"?`,
      correct: ans,
      distractors: [...wrong, ...r.shuffle(codes.filter((c) => c !== ans))],
      explanation: `Compare the sentences that contain "${target}" with those that don't: the only code present in exactly the same sentences as "${target}" is "${ans}". Codes inside a sentence are in a different order from the words, so position tells you nothing.`,
    });
  }
}

/** Letter-value codes: CAT = 24 style, with the operation hidden across two examples. */
function numberCode(r: Rng): Question {
  const ops: { text: string; f: (w: string) => number }[] = [
    { text: "the sum of the letter positions (A = 1, B = 2, …)", f: (w) => [...w].reduce((s, c) => s + pos(c), 0) },
    { text: "the sum of the reverse letter positions (A = 26, B = 25, …)", f: (w) => [...w].reduce((s, c) => s + 27 - pos(c), 0) },
    { text: "the sum of the letter positions × the number of letters", f: (w) => [...w].reduce((s, c) => s + pos(c), 0) * w.length },
    { text: "the sum of the letter positions + the number of letters", f: (w) => [...w].reduce((s, c) => s + pos(c), 0) + w.length },
    { text: "(first letter position) × (last letter position)", f: (w) => pos(w[0]) * pos(w[w.length - 1]) },
  ];
  for (;;) {
    const op = r.pick(ops);
    const [w1, w2, w3] = r.shuffle(WORDS);
    if (w1.length === w2.length) continue; // different lengths separate "× / + number of letters" from the plain sum
    const consistent = ops.filter((o) => o.f(w1) === op.f(w1) && o.f(w2) === op.f(w2));
    if (new Set(consistent.map((o) => o.f(w3))).size !== 1) continue;
    const ans = op.f(w3);
    return mcq(r, {
      prompt: `In a certain code, ${w1} = ${op.f(w1)} and ${w2} = ${op.f(w2)}. What is ${w3}?`,
      correct: String(ans),
      distractors: ops.filter((o) => o !== op).map((o) => String(o.f(w3))),
      explanation: `Test the rule on both examples: each word's number is ${op.text}. For ${w3} that gives ${ans}. One example alone often fits two rules — that's why two are given.`,
    });
  }
}

/** Two-step letter codes, shown with two examples so the combined rule can be pinned down. */
function twoStep(r: Rng): Question {
  const hardRules = RULES.filter((x) => /^(grow|alt|rev[12-]|opposite[12-]|halves[12]|halfrev[12]|pairs1|rot[LR]-?1|vc)/.test(x.id));
  for (;;) {
    const rule = r.pick(hardRules);
    const [w1, w2, w3] = r.shuffle(WORDS);
    if (new Set([w1.length, w2.length, w3.length]).size < 2) continue;
    const consistent = RULES.filter((x) => x.enc(w1) === rule.enc(w1) && x.enc(w2) === rule.enc(w2));
    if (new Set(consistent.map((x) => x.enc(w3))).size !== 1) continue;
    const ans = rule.enc(w3);
    return mcq(r, {
      prompt: `In a certain code, ${w1} is written as ${rule.enc(w1)} and ${w2} is written as ${rule.enc(w2)}. How is ${w3} written in that code?`,
      correct: ans,
      distractors: decoys(r, rule, w3, ans),
      explanation: `A single example can fit more than one rule, so check both: ${rule.text}. Applying it to ${w3} gives ${ans}.`,
    });
  }
}

export const codingHard = (seed: number): Question => {
  const r = rng((seed ^ 0x1b873593) >>> 0);
  // Sentence codes are rare in recent papers: about 1 in 7 hard coding questions.
  const x = r.next();
  return (x < 0.15 ? sentenceCode : x < 0.5 ? numberCode : twoStep)(r);
};
