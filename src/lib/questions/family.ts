/**
 * Blood relations built on a real family tree (with marriages), so every question type can be
 * generated and checked: plain and in-law chains, "pointing to a photograph", nested descriptions,
 * "cannot be determined", and multi-clue family puzzles solved by trying every possible family.
 */
import { mcq, type Rng } from "./rng";
import type { Question } from "./types";

type Gen = (r: Rng) => Question;
export type Person = { name: string; male: boolean; father?: Person; mother?: Person; spouse?: Person };

const MALE = ["Aman", "Chirag", "Farhan", "Harsh", "Jatin", "Laksh", "Rohan", "Vikram", "Arjun", "Kabir", "Nikhil", "Sunil", "Ravi", "Tarun"];
const FEMALE = ["Bela", "Divya", "Esha", "Gita", "Isha", "Kavya", "Meera", "Sana", "Priya", "Anu", "Neha", "Ritu", "Kamala", "Pooja"];
const cap = (w: string) => w[0].toUpperCase() + w.slice(1);

const parents = (p: Person) => [p.father, p.mother].filter((x): x is Person => !!x);
const isParent = (a: Person, b: Person) => parents(b).includes(a);
const siblings = (a: Person, b: Person) => a !== b && !!a.father && a.father === b.father;

/** What x is to y ("x is y's ___"), or null when the relation has no common one-word name. */
export function rel(x: Person, y: Person): string | null {
  const g = (m: string, f: string) => (x.male ? m : f);
  if (x === y) return null;
  if (x.spouse === y) return g("husband", "wife");
  if (isParent(x, y)) return g("father", "mother");
  if (isParent(y, x)) return g("son", "daughter");
  if (siblings(x, y)) return g("brother", "sister");
  if (parents(y).some((p) => isParent(x, p))) return g("grandfather", "grandmother");
  if (parents(x).some((p) => isParent(y, p))) return g("grandson", "granddaughter");
  if (parents(y).some((p) => siblings(x, p) || (!!x.spouse && siblings(x.spouse, p)))) return g("uncle", "aunt");
  if (parents(x).some((p) => siblings(y, p) || (!!y.spouse && siblings(y.spouse, p)))) return g("nephew", "niece");
  if (parents(x).some((px) => parents(y).some((py) => siblings(px, py)))) return "cousin";
  if (y.spouse && isParent(x, y.spouse)) return g("father-in-law", "mother-in-law");
  if (x.spouse && isParent(y, x.spouse)) return g("son-in-law", "daughter-in-law");
  if ((y.spouse && siblings(x, y.spouse)) || (x.spouse && siblings(x.spouse, y))) return g("brother-in-law", "sister-in-law");
  return null;
}
const BASIC = new Set(["father", "mother", "son", "daughter", "brother", "sister", "husband", "wife"]);
const ALL_WORDS = {
  male: ["father", "son", "brother", "husband", "grandfather", "grandson", "uncle", "nephew", "cousin", "father-in-law", "son-in-law", "brother-in-law"],
  female: ["mother", "daughter", "sister", "wife", "grandmother", "granddaughter", "aunt", "niece", "cousin", "mother-in-law", "daughter-in-law", "sister-in-law"],
};
/** Wrong options: same-gender words, preferring "near misses" for the right answer. */
function wordDecoys(r: Rng, ans: string, male: boolean) {
  const near: Record<string, string[]> = {
    uncle: ["father", "brother-in-law", "cousin"], aunt: ["mother", "sister-in-law", "cousin"],
    nephew: ["son", "grandson", "cousin"], niece: ["daughter", "granddaughter", "cousin"],
    cousin: ["brother", "sister", "nephew", "niece"], grandson: ["son", "nephew"], granddaughter: ["daughter", "niece"],
    "father-in-law": ["father", "uncle", "grandfather"], "mother-in-law": ["mother", "aunt", "grandmother"],
    "son-in-law": ["son", "nephew", "brother-in-law"], "daughter-in-law": ["daughter", "niece", "sister-in-law"],
    "brother-in-law": ["brother", "uncle", "cousin"], "sister-in-law": ["sister", "aunt", "cousin"],
  };
  const pool = male ? ALL_WORDS.male : ALL_WORDS.female;
  return [...r.shuffle((near[ans] ?? []).filter((w) => pool.includes(w) || w === "cousin")), ...r.shuffle(pool)].filter((w) => w !== ans).map(cap);
}

/** Three generations: grandparents, 2–3 children (most married), 1–2 grandchildren per couple. */
function buildFamily(r: Rng): Person[] {
  const m = r.shuffle(MALE);
  const f = r.shuffle(FEMALE);
  const person = (male: boolean): Person => ({ name: (male ? m : f).pop()!, male });
  const gp = person(true);
  const gm = person(false);
  gp.spouse = gm;
  gm.spouse = gp;
  const all = [gp, gm];
  for (let i = r.int(2, 3); i > 0; i--) {
    const kid = person(r.next() < 0.5);
    kid.father = gp;
    kid.mother = gm;
    all.push(kid);
    if (r.next() < 0.85) {
      const sp = person(!kid.male);
      kid.spouse = sp;
      sp.spouse = kid;
      all.push(sp);
      for (let j = r.int(1, 2); j > 0; j--) {
        const g = person(r.next() < 0.5);
        g.father = kid.male ? kid : sp;
        g.mother = kid.male ? sp : kid;
        all.push(g);
      }
    }
  }
  return all;
}
/** One-step links a statement can use ("A is the brother of B"). */
const neighbours = (p: Person, all: Person[]) => all.filter((q) => q !== p && BASIC.has(rel(q, p) ?? ""));

// ── 1. Chains (2–4 statements), in-laws allowed in the answer ───────────────
function chain(r: Rng, steps: [number, number]): Question {
  for (;;) {
    const fam = buildFamily(r);
    const path = [r.pick(fam)];
    const want = r.int(steps[0], steps[1]);
    while (path.length <= want) {
      const options = neighbours(path.at(-1)!, fam).filter((q) => !path.includes(q));
      if (!options.length) break;
      path.push(r.pick(options));
    }
    if (path.length <= want) continue;
    // Nobody may be given two different parents by the statements (that reads like a step-relation).
    const declared = new Map<Person, Set<Person>>();
    path.slice(0, -1).forEach((p, i) => {
      const q = path[i + 1];
      const w = rel(p, q)!;
      const [child, parent] = w === "son" || w === "daughter" ? [p, q] : w === "father" || w === "mother" ? [q, p] : [null, null];
      if (child && parent) declared.set(child, new Set([...(declared.get(child) ?? []), parent]));
    });
    if ([...declared.values()].some((ps) => ps.size > 1)) continue;
    const [x, y] = [path[0], path.at(-1)!];
    const ans = rel(x, y);
    if (!ans || BASIC.has(ans) && r.next() < 0.6) continue; // prefer answers that need a deduction
    const lines = path.slice(0, -1).map((p, i) => `${p.name} is the ${rel(p, path[i + 1])} of ${path[i + 1].name}.`);
    return mcq(r, {
      prompt: `${lines.join(" ")} How is ${x.name} related to ${y.name}?`,
      correct: cap(ans),
      distractors: wordDecoys(r, ans, x.male),
      explanation: `Draw the tree one statement at a time: ${lines.join(" ")} So ${x.name} is ${y.name}'s ${ans}.`,
    });
  }
}

// ── 2. "Pointing to a photograph" (self-reference traps) ────────────────────
const pointing: Gen = (r) => {
  const speakerMale = r.next() < 0.5;
  const sp = r.pick(speakerMale ? MALE : FEMALE);
  const targetMale = r.next() < 0.5;
  const he = targetMale ? "He" : "She";
  const his = targetMale ? "His" : "Her";
  const who = targetMale ? "a man" : "a woman";
  const child = targetMale ? "son" : "daughter";
  const sib = targetMale ? "brother" : "sister";
  const self = speakerMale ? "son" : "daughter";
  const parentWord = speakerMale ? "father" : "mother";
  const templates: { say: string; ans: string; why: string; ok?: boolean }[] = [
    { say: `${he} is the ${child} of the only ${self} of my ${r.pick(["father", "mother"])}.`, ans: child, why: `The only ${self} of ${sp}'s parent is ${sp} — so the person is ${sp}'s ${child}.` },
    { say: `${his} ${parentWord} is the only ${self} of my ${r.pick(["father", "mother"])}.`, ans: child, why: `The only ${self} of ${sp}'s parent is ${sp}, who is the person's ${parentWord}. So the person is ${sp}'s ${child}.` },
    { say: `${he} is the ${child} of the only son of my grandfather.`, ans: sib, why: `The only son of ${sp}'s (paternal) grandfather is ${sp}'s father, so the person is ${sp}'s ${sib}.` },
    { say: `${his} mother's only brother is my father.`, ans: "cousin", why: `The person's mother is the sister of ${sp}'s father, i.e. ${sp}'s aunt. Her child is ${sp}'s cousin.` },
    { say: `${his} mother is the wife of my father's only son.`, ans: child, why: `${sp}'s father's only son is ${sp} (male). His wife is the person's mother, so the person is ${sp}'s ${child}.`, ok: speakerMale },
  ];
  const t = r.pick(templates.filter((x) => x.ok !== false));
  return mcq(r, {
    prompt: `Pointing to ${who} in a photograph, ${sp} said, "${t.say}" How is that ${targetMale ? "man" : "woman"} related to ${sp}?`,
    correct: cap(t.ans),
    distractors: wordDecoys(r, t.ans, targetMale),
    explanation: `${t.why} Trap: "the only ${self} of my ${parentWord}" usually means the speaker.`,
  });
};

// ── 3. Nested descriptions ("Kavya's mother's brother's daughter") ──────────
function nested(r: Rng, hops: [number, number]): Question {
  for (;;) {
    const fam = buildFamily(r);
    const y = r.pick(fam);
    // Breadth-first search from y gives the shortest description (no "father's son" detours).
    const prev = new Map<Person, Person>([[y, y]]);
    const queue = [y];
    while (queue.length) {
      const p = queue.shift()!;
      for (const q of neighbours(p, fam)) if (!prev.has(q)) prev.set(q, p), queue.push(q);
    }
    const depth = (p: Person) => {
      let d = 0;
      for (let q = p; q !== y; q = prev.get(q)!) d++;
      return d;
    };
    const targets = fam.filter((p) => prev.has(p) && p !== y && depth(p) >= hops[0] && depth(p) <= hops[1] && !!rel(p, y) && !BASIC.has(rel(p, y)!));
    if (!targets.length) continue;
    const x = r.pick(targets);
    const path: Person[] = [];
    for (let q = x; q !== y; q = prev.get(q)!) path.unshift(q);
    const words = path.map((q, i) => rel(q, i ? path[i - 1] : y)!);
    const ans = rel(x, y)!;
    return mcq(r, {
      prompt: `${x.name} is ${y.name}'s ${words.join("'s ")}. How is ${x.name} related to ${y.name}?`,
      correct: cap(ans),
      distractors: wordDecoys(r, ans, x.male),
      explanation: `Walk it from ${y.name}: ${[y, ...path].map((p, i) => (i ? `→ ${words[i - 1]} (${p.name})` : p.name)).join(" ")}. So ${x.name} is ${y.name}'s ${ans}.`,
    });
  }
}

// ── 4. Gender not given → "Cannot be determined" (about half the time) ──────
const NEUTRAL: Record<string, string> = { father: "parent", mother: "parent", son: "child", daughter: "child", brother: "sibling", sister: "sibling" };
const PAIRS: [string, string][] = [["father", "mother"], ["son", "daughter"], ["brother", "sister"], ["husband", "wife"], ["grandfather", "grandmother"], ["grandson", "granddaughter"], ["uncle", "aunt"], ["nephew", "niece"], ["father-in-law", "mother-in-law"], ["son-in-law", "daughter-in-law"], ["brother-in-law", "sister-in-law"]];
const OPPOSITE = new Map(PAIRS.flatMap(([m, f]) => [[m, f], [f, m]] as [string, string][]));
const cannotTell: Gen = (r) => {
  for (;;) {
    const fam = buildFamily(r);
    const a = r.pick(fam);
    const bs = neighbours(a, fam).filter((q) => NEUTRAL[rel(a, q)!]);
    if (!bs.length) continue;
    const b = r.pick(bs);
    const cs = neighbours(b, fam).filter((q) => q !== a);
    if (!cs.length) continue;
    const c = r.pick(cs);
    const word = rel(a, c);
    if (!word || !OPPOSITE.has(word)) continue;
    const hide = r.next() < 0.5; // M called only "parent/child/sibling": gender unknown
    const l1 = `M is the ${hide ? NEUTRAL[rel(a, b)!] : rel(a, b)} of N.`;
    const l2 = `N is the ${rel(b, c)} of O.`;
    const other = OPPOSITE.get(word)!;
    const correct = hide ? "Cannot be determined" : cap(word);
    return mcq(r, {
      prompt: `${l1} ${l2} How is M related to O?`,
      correct,
      distractors: [cap(word), cap(other), "Cannot be determined", ...wordDecoys(r, word, a.male)].filter((w) => w !== correct),
      explanation: hide
        ? `"${NEUTRAL[rel(a, b)!]}" does not say whether M is male or female, so M is O's ${word} or ${other}: it cannot be determined.`
        : `M is the ${rel(a, b)} of N and N is the ${rel(b, c)} of O, so M is O's ${word}. Always check whether every gender you need is actually given.`,
    });
  }
};

// ── 5. Family puzzles with several clues (solved over every possible family) ─
type World = { people: Person[]; byName: Map<string, Person> };
function familyPuzzle(r: Rng, hard: boolean): Question {
  for (;;) {
    const letters = ["P", "Q", "R", "S", "T", "U"];
    // Structure: grandparents G1 (m) + G2 (f); their child C, C's spouse D; grandchildren K1, K2.
    const makeWorld = (order: string[], cMale: boolean, k1: boolean, k2: boolean): World => {
      const [g1, g2, c, d, a, b] = order;
      const G1: Person = { name: g1, male: true };
      const G2: Person = { name: g2, male: false, spouse: G1 };
      G1.spouse = G2;
      const C: Person = { name: c, male: cMale, father: G1, mother: G2 };
      const D: Person = { name: d, male: !cMale, spouse: C };
      C.spouse = D;
      const [fa, mo] = cMale ? [C, D] : [D, C];
      const K1: Person = { name: a, male: k1, father: fa, mother: mo };
      const K2: Person = { name: b, male: k2, father: fa, mother: mo };
      const people = [G1, G2, C, D, K1, K2];
      return { people, byName: new Map(people.map((p) => [p.name, p])) };
    };
    const perms = (xs: string[]): string[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
    const worlds: World[] = [];
    for (const o of perms(letters)) for (const cm of [true, false]) for (const k1 of [true, false]) for (const k2 of [true, false]) {
      if (o[4] > o[5]) continue; // K1/K2 are interchangeable
      worlds.push(makeWorld(o, cm, k1, k2));
    }
    const truth = makeWorld(r.shuffle(letters), r.next() < 0.5, r.next() < 0.5, r.next() < 0.5);
    const facts: { text: string; ok: (w: World) => boolean }[] = [];
    for (const x of truth.people) for (const y of truth.people) {
      const w = rel(x, y);
      if (w && w !== "cousin") facts.push({ text: `${x.name} is the ${w} of ${y.name}.`, ok: (wd) => rel(wd.byName.get(x.name)!, wd.byName.get(y.name)!) === w });
    }
    // Question first, then add clues until every family that fits gives the same answer.
    const [qx, qy] = r.shuffle(truth.people);
    const askCount = !hard && r.next() < 0.3;
    const answerIn = (wd: World) => (askCount ? String(wd.people.filter((p) => !p.male).length) : rel(wd.byName.get(qx.name)!, wd.byName.get(qy.name)!) ?? "none");
    const want = answerIn(truth);
    if (want === "none") continue;
    let cand = worlds;
    const clues: string[] = [];
    for (const f of r.shuffle(facts)) {
      if (new Set(cand.map(answerIn)).size === 1) break;
      if (f.text.startsWith(`${qx.name} is the`) && f.text.endsWith(`of ${qy.name}.`)) continue; // don't give the answer away
      const next = cand.filter(f.ok);
      if (next.length < cand.length) {
        clues.push(f.text);
        cand = next;
      }
    }
    if (new Set(cand.map(answerIn)).size !== 1 || clues.length < (hard ? 4 : 3) || clues.length > 7) continue;
    const q = askCount ? "How many female members are there in the family?" : `How is ${qx.name} related to ${qy.name}?`;
    return mcq(r, {
      prompt: `A family has six members: P, Q, R, S, T and U. There are two married couples and three generations.\n${clues.map((c) => `• ${c}`).join("\n")}\n${q}`,
      correct: askCount ? want : cap(want),
      distractors: askCount ? ["1", "2", "3", "4"].filter((v) => v !== want) : wordDecoys(r, want, qx.male),
      explanation: `Build the tree from the clues: ${truth.people[0].name} and ${truth.people[1].name} are the grandparents; ${truth.people[2].name} is their ${truth.people[2].male ? "son" : "daughter"}, married to ${truth.people[3].name}; ${truth.people[4].name} and ${truth.people[5].name} are the grandchildren. Every family that fits the clues gives the same answer: ${askCount ? `${want} female members` : `${qx.name} is ${qy.name}'s ${want}`}.`,
    });
  }
}

export const FAMILY_STANDARD: Gen[] = [(r) => chain(r, [2, 3]), pointing, (r) => nested(r, [2, 3]), cannotTell, (r) => familyPuzzle(r, false)];
export const FAMILY_HARD: Gen[] = [(r) => chain(r, [3, 4]), (r) => nested(r, [3, 4]), (r) => familyPuzzle(r, true), pointing];
