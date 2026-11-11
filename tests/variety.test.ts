import { describe, expect, it } from "vitest";
import { generate } from "@/lib/questions";

// Pure logic: no DB needed.
const SEEDS = 1500;
/** Rough "question type": the start of the code (or prompt) plus what the options look like. */
const shape = (q: { prompt: string; code?: string; options: string[] }) =>
  (q.code ?? q.prompt).replace(/\d+/g, "#").replace(/\b[A-Z][a-z]+\b/g, "N").slice(0, 25) + "|" + q.options[0].replace(/\d+/g, "#").replace(/[A-Z]/g, "L");

describe("topics that used to have one template now vary", () => {
  it.each(["r-direction", "r-clock", "r-calendar", "r-odd", "m-average", "m-boats", "p-functions"])("%s has several question types", (id) => {
    const shapes = new Set<string>();
    for (let s = 1; s <= 400; s++) {
      const q = generate(`${id}:${s}`);
      shapes.add(shape(q));
    }
    expect(shapes.size).toBeGreaterThanOrEqual(3);
  });
});

describe("new templates: answers re-derived independently", () => {
  it("clock counts match a step-by-step scan", () => {
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`r-clock:${s}`);
      const m = /hands of a clock (coincide|point in opposite directions|are at right angles) between (\d+) (AM|PM) and/.exec(q.prompt);
      if (!m) continue;
      const theta = m[1] === "coincide" ? 0 : m[1].startsWith("point") ? 180 : 90;
      const h = (Number(m[2]) % 12) + (m[3] === "PM" ? 12 : 0);
      const span = Number(/\((\d+) hours\)/.exec(q.prompt)?.[1] ?? 0) || (() => {
        const e = /and (\d+) (AM|PM)/.exec(q.prompt)!;
        const end = (Number(e[1]) % 12) + (e[2] === "PM" ? 12 : 0);
        return (end - h + 24) % 24;
      })();
      // In 1/11-minute steps j, the gap between the hands is j/2 degrees (mod 360).
      let n = 0;
      for (let j = h * 660; j < (h + span) * 660; j++) {
        const gap = (j / 2) % 360;
        if (gap === theta || gap === (360 - theta) % 360) n++;
      }
      expect(q.options[q.answer], `${s}: ${q.prompt}`).toBe(String(n));
    }
  });

  it("turning questions end on the right compass point", () => {
    const C = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`r-direction:${s}`);
      const m = /is facing ([A-Za-z-]+)\. \w+ turns (.+)\. Which/.exec(q.prompt);
      if (!m) continue;
      let deg = C.indexOf(m[1]) * 45;
      for (const t of m[2].matchAll(/(\d+)° (clockwise|anticlockwise)/g)) deg += (t[2] === "clockwise" ? 1 : -1) * Number(t[1]);
      expect(q.options[q.answer]).toBe(C[(((deg % 360) + 360) % 360) / 45]);
    }
  });

  it("mirror times: mirroring the answer gives back the shown time", () => {
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`r-clock:${s}`);
      const m = /shows (\d+):(\d+)\./.exec(q.prompt);
      if (!m || !q.prompt.includes("mirror")) continue;
      const [ah, am] = q.options[q.answer].split(":").map(Number);
      const mirrored = (720 - (ah % 12) * 60 - am + 720) % 720;
      expect(((Number(m[1]) % 12) * 60 + Number(m[2])) % 720).toBe(mirrored);
    }
  });

  it("weekday counts in a year match a day-by-day count", () => {
    const D = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (let s = 1; s <= SEEDS; s++) {
      const q = generate(`r-calendar:${s}`);
      const m = /How many (\w+)s are there in the year (\d+)/.exec(q.prompt);
      if (!m) continue;
      const y = Number(m[2]);
      let n = 0;
      for (let d = new Date(Date.UTC(y, 0, 1)); d.getUTCFullYear() === y; d.setUTCDate(d.getUTCDate() + 1)) if (D[d.getUTCDay()] === m[1]) n++;
      expect(q.options[q.answer]).toBe(String(n));
    }
  });
});
