import { describe, expect, it } from "vitest";
import { generate } from "@/lib/questions";
import { oddOneIsUnique } from "@/lib/questions/rng";

describe("odd one out (numbers): exactly one defensible answer", () => {
  it("rejects the reported question: 87 is the non-multiple of 7, but 35 the non-multiple of 3", () => {
    expect(oddOneIsUnique([42, 35, 87, 63], 87)).toBe(false);
    expect(oddOneIsUnique([25, 49, 81, 50], 50)).toBe(true); // not a square, and the only even one: same answer
    expect(oddOneIsUnique([16, 36, 64, 50], 50)).toBe(false); // 64 is also the only cube
  });

  it.each(["", ":h"])("no obvious property points at a different option (tier %s)", (tier) => {
    const bad: string[] = [];
    for (let s = 1; s <= 3000; s++) {
      const q = generate(`r-odd:${s}${tier}`);
      if (!q.options.every((o) => /^\d+$/.test(o))) continue; // letter / pair variants
      const nums = q.options.map(Number);
      if (!oddOneIsUnique(nums, nums[q.answer])) bad.push(`${s}${tier}: ${q.options.join(", ")} → ${q.options[q.answer]}`);
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});
