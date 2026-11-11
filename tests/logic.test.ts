import { describe, expect, it } from "vitest";
import { generate } from "@/lib/questions";
import { solveChain, solveSyllogism, type Form, type Prop } from "@/lib/questions/logic";

const P = (f: Form, s: number, p: number): Prop => ({ f, s, p });

describe("syllogism solver", () => {
  // The old hand-written bank, as [statement 1, statement 2, conclusion I, conclusion II, expected answer].
  const KNOWN: [Prop, Prop, Prop, Prop, number][] = [
    [P("A", 0, 1), P("A", 1, 2), P("A", 0, 2), P("I", 2, 0), 2], // All pens books; all books tables
    [P("I", 0, 1), P("E", 1, 2), P("O", 0, 2), P("E", 0, 2), 0], // Some cats dogs; no dog rat
    [P("A", 0, 1), P("I", 1, 2), P("I", 0, 2), P("A", 2, 1), 3], // All roses flowers; some flowers red
    [P("E", 0, 1), P("A", 1, 2), P("O", 2, 0), P("E", 2, 0), 0], // No car bus; all buses trucks
    [P("I", 0, 1), P("I", 1, 2), P("I", 0, 2), P("E", 0, 2), 4], // Some phones laptops; some laptops tablets
    [P("A", 0, 1), P("E", 1, 2), P("E", 0, 2), P("I", 1, 0), 2], // All teachers learners; no learner lazy
    [P("I", 0, 1), P("A", 1, 2), P("I", 0, 2), P("A", 2, 1), 0], // Some fruits sweet; all sweet tasty
    [P("A", 0, 1), P("I", 1, 2), P("I", 0, 2), P("I", 2, 1), 1], // All engineers graduates; some graduates artists
    [P("E", 0, 1), P("I", 1, 2), P("O", 2, 0), P("E", 2, 0), 0], // No bird fish; some fish pets
    [P("A", 0, 1), P("A", 1, 2), P("I", 2, 0), P("A", 2, 0), 0], // All servers computers; all computers machines
    [P("I", 0, 1), P("A", 1, 2), P("I", 0, 2), P("I", 2, 1), 2], // Some rivers lakes; all lakes ponds
  ];
  it.each(KNOWN.map((k, i) => [i, k] as const))("matches hand-solved item %i", (_, [s1, s2, c1, c2, answer]) => {
    expect(solveSyllogism([s1, s2], c1, c2)).toBe(answer);
  });

  it("generator produces every answer type and always five options", () => {
    const answers = new Set<number>();
    for (let seed = 1; seed <= 400; seed++) {
      const q = generate(`r-syllogism:${seed}`);
      expect(q.options).toHaveLength(5);
      answers.add(q.answer);
    }
    expect([...answers].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("blood relation chains", () => {
  it.each([
    [["sibling", "sibling", "parent"], true, "uncle"], // A brother of B, B sister of C, C father of D
    [["parent", "sibling"], false, "mother"],
    [["child", "child"], true, "grandson"],
    [["parent", "parent"], false, "grandmother"],
    [["child", "parent"], true, "brother"],
    [["child", "sibling", "parent"], false, "cousin"], // X's parent and Y's parent are siblings
    [["sibling", "parent"], false, "aunt"],
    [["parent", "parent", "parent"], true, null], // great-grandfather: outside the table
    [["parent", "child"], true, null], // a second parent for someone who already has one
  ] as const)("%j (male=%s) → %s", (steps, male, relation) => {
    expect(solveChain([...steps], male)?.relation ?? null).toBe(relation);
  });

  it("every speaker's name matches the gender of their relation word", () => {
    const FEMALE = ["Bela", "Divya", "Esha", "Gita", "Isha", "Kavya", "Meera", "Sana"];
    for (let seed = 1; seed <= 400; seed++) {
      if (seed % 4 === 0) continue;
      const { prompt } = generate(`r-blood:${seed}`);
      if (prompt.includes(" means ")) continue; // coded variant: letters (A, B, P…), not named people
      for (const [line, name, word] of prompt.matchAll(/(\w+) is the (\w+) of/g)) {
        expect(FEMALE.includes(name), `${seed}: ${line}`).toBe(["mother", "daughter", "sister"].includes(word));
      }
    }
  });

  it("generated questions name the computed relation as the answer", () => {
    for (let seed = 1; seed <= 200; seed++) {
      if (seed % 4 === 0) continue; // hand-written puzzles
      const q = generate(`r-blood:${seed}`);
      expect(q.explanation).toContain(`'s ${q.options[q.answer].toLowerCase()}.`);
    }
  });
});
