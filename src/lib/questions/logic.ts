/**
 * Exact solvers behind the syllogism and blood-relation generators, so every generated answer is
 * computed, not hand-written.
 */

// ---------------------------------------------------------------------------------------------
// Syllogisms: brute-force every Venn diagram of three terms.
// A diagram = which of the 7 regions are non-empty; region r (1..7) has bit t set if it is inside term t.
// Like placement-test convention, every term is assumed non-empty (so "All X are Y" ⇒ "Some Y are X").

export type Form = "A" | "E" | "I" | "O"; // All / No / Some / Some…not
export type Prop = { f: Form; s: number; p: number };

const REGIONS = [1, 2, 3, 4, 5, 6, 7];
const inside = (region: number, term: number) => (region >> term) & 1;

const DIAGRAMS = Array.from({ length: 128 }, (_, m) => REGIONS.filter((r) => (m >> (r - 1)) & 1)).filter((present) =>
  [0, 1, 2].every((t) => present.some((r) => inside(r, t))),
);

export function holds({ f, s, p }: Prop, present: number[]) {
  const both = present.some((r) => inside(r, s) && inside(r, p));
  const sNotP = present.some((r) => inside(r, s) && !inside(r, p));
  return f === "A" ? !sNotP : f === "E" ? !both : f === "I" ? both : sNotP;
}

/** 0 only I, 1 only II, 2 both, 3 neither, 4 either I or II (exactly one is true in every diagram). */
export function solveSyllogism(statements: Prop[], c1: Prop, c2: Prop): 0 | 1 | 2 | 3 | 4 {
  const fits = DIAGRAMS.filter((d) => statements.every((s) => holds(s, d)));
  if (!fits.length) throw new Error("contradictory statements");
  const f1 = fits.every((d) => holds(c1, d));
  const f2 = fits.every((d) => holds(c2, d));
  if (f1 && f2) return 2;
  if (f1) return 0;
  if (f2) return 1;
  return fits.every((d) => holds(c1, d) !== holds(c2, d)) ? 4 : 3;
}

export function sentence({ f, s, p }: Prop, terms: string[]) {
  const [x, y] = [terms[s], terms[p]];
  return f === "A" ? `All ${x} are ${y}.` : f === "E" ? `No ${x} are ${y}.` : f === "I" ? `Some ${x} are ${y}.` : `Some ${x} are not ${y}.`;
}

// ---------------------------------------------------------------------------------------------
// Blood relations: build the family tree the statements describe, then read off the relation.

export type Step = "parent" | "child" | "sibling"; // "Pᵢ is the <parent|child|sibling> of Pᵢ₊₁"

interface Person {
  parent?: Person;
}

const RELATION: Record<string, [string, string]> = {
  // [up from X to the common ancestor, up from Y] → [male, female]
  "0,1": ["father", "mother"],
  "0,2": ["grandfather", "grandmother"],
  "1,0": ["son", "daughter"],
  "2,0": ["grandson", "granddaughter"],
  "1,1": ["brother", "sister"],
  "1,2": ["uncle", "aunt"],
  "2,1": ["nephew", "niece"],
  "2,2": ["cousin", "cousin"],
};

export const RELATION_WORDS = { male: Object.values(RELATION).map((r) => r[0]), female: Object.values(RELATION).map((r) => r[1]) };

/**
 * Relation of the first person to the last along a chain of steps, or null when the chain is not
 * allowed (a second parent for someone who already has one) or the result is outside the table above.
 */
export function solveChain(steps: Step[], firstIsMale: boolean): { relation: string; key: string } | null {
  const people: Person[] = [{}];
  for (const step of steps) {
    const cur = people[people.length - 1];
    if (step === "parent") people.push({ parent: cur });
    else if (step === "child") {
      if (cur.parent) return null;
      cur.parent = {};
      people.push(cur.parent);
    } else {
      cur.parent ??= {};
      people.push({ parent: cur.parent });
    }
  }
  const up = (p: Person) => {
    const chain: Person[] = [];
    for (let n: Person | undefined = p; n; n = n.parent) chain.push(n);
    return chain;
  };
  const xUp = up(people[0]);
  const yUp = up(people[people.length - 1]);
  const b = yUp.findIndex((n) => xUp.includes(n));
  if (b < 0) return null;
  const a = xUp.indexOf(yUp[b]);
  const key = `${a},${b}`;
  const rel = RELATION[key];
  return rel ? { relation: rel[firstIsMale ? 0 : 1], key } : null;
}

export const STEP_WORDS: Record<Step, [string, string]> = { parent: ["father", "mother"], child: ["son", "daughter"], sibling: ["brother", "sister"] };

export const RELATION_REASON: Record<string, string> = {
  "0,1": "is a direct parent of",
  "0,2": "is a parent of a parent of",
  "1,0": "is a child of",
  "2,0": "is a child of a child of",
  "1,1": "shares a parent with",
  "1,2": "is a sibling of a parent of",
  "2,1": "is a child of a sibling of",
  "2,2": "is a child of a sibling of a parent of",
};
