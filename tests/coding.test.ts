import { describe, expect, it } from "vitest";
import { generate } from "@/lib/questions";

// Pure logic: no DB needed.
describe("coding–decoding variety", () => {
  it("standard questions cover many code types evenly, not just +1, +2, +3", () => {
    const texts: string[] = [];
    for (let s = 1; s <= 3000; s++) texts.push(generate(`r-coding:${s}`).explanation);
    const types = {
      "fixed shift": /: each letter moves/,
      opposite: /opposite letter/,
      reverse: /written backwards\b(?! in place)/,
      "changing shift": /shift changes with position/,
      alternate: /alternately/,
      "halves swap": /halves of the word swap/,
      "each half reversed": /each half of the word is written backwards/,
      "pair swap": /neighbouring letters swaps/,
      rotation: /moves to the (end|front)/,
      "vowels vs consonants": /vowels move/,
      "letters to numbers": /position (in the alphabet|counted from Z)|position \+ 1/,
      substitution: /in this language/,
    };
    for (const [name, re] of Object.entries(types)) {
      const share = texts.filter((t) => re.test(t)).length / texts.length;
      expect(share, name).toBeGreaterThan(0.03); // every type shows up regularly
      expect(share, name).toBeLessThan(0.2); // and none dominates
    }
  });

  it("hard questions mix sentence codes, number codes and two-step letter codes", () => {
    const kinds = new Set<string>();
    for (let s = 1; s <= 300; s++) {
      const p = generate(`r-coding:${s}:h`).prompt;
      kinds.add(p.includes('" is written as "') ? "sentence" : / = \d+/.test(p) ? "number" : "letters");
    }
    expect([...kinds].sort()).toEqual(["letters", "number", "sentence"]);
  });

  it("sentence codes: the answer is the only code that appears exactly where the word does", () => {
    for (let s = 1; s <= 1500; s++) {
      const q = generate(`r-coding:${s}:h`);
      if (!q.prompt.includes('" is written as "')) continue;
      const target = /code for "(\w+)"/.exec(q.prompt)![1];
      const pairs = [...q.prompt.matchAll(/"([a-z ]+)" is written as "([a-z ]+)"/g)].map((m) => [m[1].split(" "), m[2].split(" ")]);
      const ans = q.options[q.answer];
      const allCodes = new Set(pairs.flatMap(([, c]) => c));
      const matching = [...allCodes].filter((c) => pairs.every(([w, cs]) => w.includes(target) === cs.includes(c)));
      expect(matching, `${s}`).toEqual([ans]);
    }
  });
});

describe("coding–decoding: hard sentence codes are rare", () => {
  it("about 1 in 7 hard coding questions is a sentence code", () => {
    let n = 0;
    for (let s = 1; s <= 2000; s++) if (generate(`r-coding:${s}:h`).prompt.includes('" is written as "')) n++;
    expect(n / 2000).toBeGreaterThan(0.08);
    expect(n / 2000).toBeLessThan(0.22);
  });
});

describe("coding–decoding: substitution answers", () => {
  it("the answer is the new name of the real thing", () => {
    const real: Record<string, string> = { "What do we drink?": "water", "What do we eat?": "food", "What do we sit on?": "chair", "What do we write with?": "pen", "What do we sleep on?": "bed", "Where do aeroplanes fly?": "sky", "What gives us light during the day?": "sun", "What do we read?": "book", "What do we wear on our feet?": "shoe", "What do we open a lock with?": "key" };
    let checked = 0;
    for (let s = 1; s <= 3000; s++) {
      const q = generate(`r-coding:${s}`);
      if (!q.prompt.includes(" is called ")) continue;
      const ask = Object.keys(real).find((k) => q.prompt.endsWith(k))!;
      const m = new RegExp(`'${real[ask]}' is called '(\\w+)'`).exec(q.prompt)!;
      expect(q.options[q.answer]).toBe(m[1]);
      checked++;
    }
    expect(checked).toBeGreaterThan(50);
  });
});
