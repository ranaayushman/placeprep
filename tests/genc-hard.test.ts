import { describe, expect, it } from "vitest";
import { STATIC_HARD } from "@/lib/questions/genc-hard";
import { TOPIC_BY_ID, generate } from "@/lib/questions";
import { pickFresh, type History } from "@/lib/exam/plan";

// Enough hard items that a GenC mock at 100% hard does not repeat for several attempts.
const MIN: Record<string, number> = {
  "v-correction": 20, "v-fill": 20, "v-vocab": 16, "v-error": 12, "v-jumble": 12,
  "r-alpha": 14, "r-statement": 14,
  "t-java": 30, "t-python": 30, "t-dbms": 20, "t-cloud": 12,
  "t-debug": 50, "t-debug-py": 50,
};

describe("static hard banks", () => {
  it.each(Object.keys(MIN))("%s is big enough and well formed", (id) => {
    const items = STATIC_HARD[id];
    expect(items.length).toBeGreaterThanOrEqual(MIN[id]);
    const keys = new Set<string>();
    for (const q of items) {
      const label = q.prompt.slice(0, 60);
      expect(q.options.length, label).toBe(4);
      expect(new Set(q.options).size, label).toBe(4);
      expect(q.answer, label).toBeGreaterThanOrEqual(0);
      expect(q.answer, label).toBeLessThan(4);
      expect(q.explanation.length, label).toBeGreaterThan(10);
      // Options are shuffled, so options that point at other options make no sense.
      for (const o of q.options) expect(o, label).not.toMatch(/(all|none|both) of (the )?(above|these)/i);
      const k = q.prompt + "\n" + (q.code ?? "");
      expect(keys.has(k), `duplicate: ${label}`).toBe(false);
      keys.add(k);
    }
  });

  it("is wired in as the topic's hard tier and served without repeats inside one attempt", () => {
    for (const id of Object.keys(MIN)) {
      const t = TOPIC_BY_ID.get(id)!;
      expect(t.hardPoolSize, id).toBe(STATIC_HARD[id].length);
      const history: History = { seen: new Map(), prints: new Map(), mocksAgo: new Map() };
      const taken = new Set<string>();
      const n = Math.min(t.hardPoolSize!, 12);
      const refs = Array.from({ length: n }, () => pickFresh(t, history, taken, true));
      expect(refs.every((r) => r.endsWith(":h")), id).toBe(true);
      expect(new Set(refs.map((r) => generate(r).prompt + generate(r).code)).size, id).toBe(n);
    }
  });
});
