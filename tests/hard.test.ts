import { describe, expect, it } from "vitest";
import { generate, TOPICS } from "@/lib/questions";

// Pure logic: no DB needed. Every hard-tier generator, many seeds.
const SEEDS = 1500;
const HARD_TOPICS = TOPICS.filter((t) => t.hard).map((t) => t.id);

describe("hard tier: structure", () => {
  it("has hard generators for the high-gap topics", () => {
    expect(HARD_TOPICS.length).toBeGreaterThanOrEqual(13);
  });

  it.each(HARD_TOPICS)("%s: valid, distinct options, deterministic, no junk", (id) => {
    const bad: string[] = [];
    for (let s = 1; s <= SEEDS; s++) {
      const ref = `${id}:${s}:h`;
      const q = generate(ref);
      if (JSON.stringify(generate(ref)) !== JSON.stringify(q)) bad.push(`${ref} non-deterministic`);
      if (q.options.length < 4) bad.push(`${ref} only ${q.options.length} options`);
      if (new Set(q.options).size !== q.options.length) bad.push(`${ref} duplicate options: ${q.options.join(" | ")}`);
      if (!(q.answer >= 0 && q.answer < q.options.length)) bad.push(`${ref} answer index ${q.answer}`);
      const blob = [q.prompt, q.code ?? "", q.explanation, ...q.options].join(" | ");
      if (/NaN|undefined|Infinity|\[object|-\d+ days|^-/.test(blob)) bad.push(`${ref} junk: ${blob.slice(0, 200)}`);
      if (q.options.some((o) => /^−?-/.test(o))) bad.push(`${ref} negative option ${q.options.join(" | ")}`);
    }
    expect(bad.slice(0, 8)).toEqual([]);
  }, 120_000); // exhaustive puzzle solvers are slower

  it("hard questions differ from standard ones for the same seed", () => {
    const show = (q: { prompt: string; code?: string; options: string[] }) => q.prompt + (q.code ?? "") + [...q.options].sort().join("|");
    for (const id of HARD_TOPICS) expect(show(generate(`${id}:5:h`))).not.toBe(show(generate(`${id}:5`)));
  });
});

describe("hard tier: answers re-derived independently", () => {
  it("clock: the hands really make the asked angle at the answered time", () => {
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`r-clock:${s}:h`);
      const m = /Between (\d+) and \d+ o'clock, at what time are the hands of a clock (together|exactly opposite|at right angles)/.exec(q.prompt);
      if (!m) continue;
      const H = Number(m[1]);
      const want = m[2] === "together" ? 0 : m[2] === "exactly opposite" ? 180 : 90;
      const [, mm, frac] = /^\d+:(\d+)(?: (\d+)\/11)?$/.exec(q.options[q.answer])!;
      const t = Number(mm) + (frac ? Number(frac) / 11 : 0);
      let angle = Math.abs(30 * H - 5.5 * t) % 360;
      if (angle > 180) angle = 360 - angle;
      expect(Math.abs(angle - want), `${s}: ${q.options[q.answer]}`).toBeLessThan(1e-6);
    }
  });

  it("number system: inclusion–exclusion answer matches a direct count", () => {
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`m-number:${s}:h`);
      const m = /from 1 to ([\d,]+) are divisible by (\d+) or (\d+) but not by (\d+)/.exec(q.prompt);
      if (!m) continue;
      const [N, a, b, c] = [Number(m[1].replace(/,/g, "")), Number(m[2]), Number(m[3]), Number(m[4])];
      let n = 0;
      for (let x = 1; x <= N; x++) if ((x % a === 0 || x % b === 0) && x % c !== 0) n++;
      expect(q.options[q.answer].replace(/,/g, "")).toBe(String(n));
    }
  });

  it("calendar: the repeated-calendar year really matches", () => {
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`r-calendar:${s}:h`);
      const m = /calendar for the year (\d+)/.exec(q.prompt);
      if (!m) continue;
      const Y = Number(m[1]);
      const ans = Number(q.options[q.answer]);
      const sig = (y: number) => `${new Date(Date.UTC(y, 0, 1)).getUTCDay()}-${new Date(Date.UTC(y, 1, 29)).getUTCMonth()}`;
      expect(sig(ans)).toBe(sig(Y));
      for (let y = Y + 1; y < ans; y++) expect(sig(y)).not.toBe(sig(Y));
    }
  });
});
