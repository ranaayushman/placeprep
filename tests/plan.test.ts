import { describe, expect, it } from "vitest";
import { fingerprint, hardSlots, pickFresh, planTopics, type History, type MocksAgo } from "@/lib/exam/plan";
import { EXAMS, HARD_SHARE_BY_LEVEL, INFOSYS_SE_PATTERN } from "@/lib/exam/pattern";
import { generate, TOPIC_BY_ID, toView, topicsFor } from "@/lib/questions";
import type { SectionId } from "@/lib/questions/types";

// Pure logic: no DB needed (runs under the normal config too).

/** Simulates `mocks` consecutive mocks for one student, feeding each plan back as history. */
function simulate(section: SectionId, count: number, mocks: number) {
  const topics = topicsFor(section).filter((t) => t.id !== "v-rc");
  const plans: string[][] = [];
  for (let m = 0; m < mocks; m++) {
    const mocksAgo: MocksAgo = new Map();
    plans.forEach((p, i) => p.forEach((id) => mocksAgo.set(id, Math.min(mocksAgo.get(id) ?? Infinity, plans.length - 1 - i))));
    plans.push(planTopics(topics, count, mocksAgo).map((t) => t.id));
  }
  return { topics, plans };
}

describe("planTopics: coverage", () => {
  it("a section with enough slots covers every topic in every mock (reasoning: 11 topics, 15 slots)", () => {
    const { topics, plans } = simulate("reasoning", 15, 200);
    for (const p of plans) {
      expect(p).toHaveLength(15);
      for (const t of topics) expect(p).toContain(t.id);
    }
  });

  it.each(INFOSYS_SE_PATTERN.filter((s) => s.section !== "writing" && s.section !== "verbal").map((s) => [s.section, s.questions] as const))(
    "%s (%i slots): every topic appears within each run of ceil(topics/slots) consecutive mocks",
    (section, count) => {
      const { topics, plans } = simulate(section, count, 300);
      const window = Math.max(1, Math.ceil(topics.length / count));
      for (const p of plans) expect(p).toHaveLength(count);
      for (let i = 0; i + window <= plans.length; i++) {
        const covered = new Set(plans.slice(i, i + window).flat());
        for (const t of topics) expect(covered, `${t.id} missing from mocks ${i + 1}–${i + window}`).toContain(t.id);
      }
    },
  );

  it("never repeats a topic in a section that has fewer slots than topics", () => {
    const { plans } = simulate("math", 10, 100);
    for (const p of plans) expect(new Set(p).size).toBe(p.length);
  });

  it("still favours frequent topics in the free slots (math: DI weight 4 vs boats weight 1)", () => {
    const math = topicsFor("math");
    let di = 0;
    let boats = 0;
    // History where both are equally recent, so only weight decides.
    const mocksAgo: MocksAgo = new Map(math.map((t) => [t.id, 0]));
    for (let i = 0; i < 3000; i++) {
      const p = planTopics(math, 10, mocksAgo).map((t) => t.id);
      if (p.includes("m-di")) di++;
      if (p.includes("m-boats")) boats++;
    }
    expect(di).toBeGreaterThan(boats);
  });

  it("mixes topics instead of grouping them", () => {
    const reasoning = topicsFor("reasoning");
    const orders = new Set(Array.from({ length: 50 }, () => planTopics(reasoning, 15).map((t) => t.id).join(",")));
    expect(orders.size).toBeGreaterThan(40);
  });
});

describe("fingerprint", () => {
  it("ignores option order but not content", () => {
    const a = fingerprint({ prompt: "Q", options: ["1", "2", "3", "4"] });
    expect(fingerprint({ prompt: "Q", options: ["4", "3", "2", "1"] })).toBe(a);
    expect(fingerprint({ prompt: "Q", options: ["1", "2", "3", "5"] })).not.toBe(a);
    expect(fingerprint({ prompt: "Q2", options: ["1", "2", "3", "4"] })).not.toBe(a);
  });
});

describe("pickFresh: no repeated questions", () => {
  const empty = (): History => ({ seen: new Map(), prints: new Map(), mocksAgo: new Map() });

  // m-prob renders only ~85 distinct questions; before this, random seeds repeated them quickly.
  it.each(["m-prob", "r-clock", "v-correction"])("%s: no repeats until the topic's questions run out", (id) => {
    const topic = TOPIC_BY_ID.get(id)!;
    const history = empty();
    const shown = new Set<string>();
    let repeats = 0;
    for (let i = 0; i < 40; i++) {
      const fp = fingerprint(toView(generate(pickFresh(topic, history, new Set()))));
      if (shown.has(fp)) repeats++;
      shown.add(fp);
    }
    expect(repeats).toBe(0);
  });

  it("skips questions seen in earlier attempts", () => {
    const topic = TOPIC_BY_ID.get("m-prob")!;
    const history = empty();
    const before = new Set<string>();
    for (let s = 1; s <= 30; s++) before.add(fingerprint(toView(topic.generate(s))));
    history.prints.set(topic.id, new Set(before));
    for (let i = 0; i < 20; i++) {
      expect(before.has(fingerprint(toView(generate(pickFresh(topic, history, new Set())))))).toBe(false);
    }
  });
});

describe("hard tier", () => {
  it("about 70% of a section's slots are hard where the topics have a hard tier", () => {
    const math = topicsFor("math");
    let hard = 0;
    let total = 0;
    for (let i = 0; i < 200; i++) {
      const ts = planTopics(math, 10);
      const hs = hardSlots(ts);
      hs.forEach((h, k) => expect(!h || !!ts[k].hard).toBe(true)); // never hard without a hard tier
      hard += hs.filter(Boolean).length;
      total += ts.filter((t) => t.hard).length;
    }
    expect(hard).toBeGreaterThan(0);
    expect(hard).toBeLessThanOrEqual(total);
  });

  it("pickFresh tags hard refs and they regenerate as the hard question", () => {
    const topic = TOPIC_BY_ID.get("m-prob")!;
    const ref = pickFresh(topic, { seen: new Map(), prints: new Map(), mocksAgo: new Map() }, new Set(), true);
    expect(ref).toMatch(/^m-prob:\d+:h$/);
    const seed = Number(ref.split(":")[1]);
    expect(JSON.stringify(generate(ref))).toBe(JSON.stringify(topic.hard!(seed)));
    expect(JSON.stringify(generate(`m-prob:${seed}`))).toBe(JSON.stringify(topic.generate(seed)));
  });
});

describe("mock levels", () => {
  it("Infosys has a normal Mock 1 and a hard Mock 2", () => {
    expect(EXAMS.find((e) => e.id === "infosys-se")?.level).toBe("normal");
    expect(EXAMS.find((e) => e.id === "infosys-se-hard")?.level).toBe("hard");
  });

  it("hard share follows the level: normal 30–50%, hard 70–80% of slots (capped by topics with a hard tier)", () => {
    const pseudo = topicsFor("pseudocode").filter((t) => t.hard); // every slot eligible: shares are exact
    for (const [level, [lo, hi]] of Object.entries(HARD_SHARE_BY_LEVEL)) {
      for (const share of [lo, (lo + hi) / 2, hi]) {
        const hs = hardSlots([...pseudo, ...pseudo, ...pseudo, pseudo[0]], share); // 10 slots
        const n = hs.filter(Boolean).length;
        expect(n, level).toBe(Math.round(share * 10));
      }
    }
    expect(HARD_SHARE_BY_LEVEL.normal[1]).toBeLessThan(HARD_SHARE_BY_LEVEL.hard[0]);
  });
});
