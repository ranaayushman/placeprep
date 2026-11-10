import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "@/db";
import { DUPLICATE_LIKELY, DUPLICATE_POSSIBLE } from "@/lib/community/config";
import { findMatches, seedBankFingerprints } from "@/lib/community/fingerprints";
import { normOptions, normStem } from "@/lib/community/normalize";
import { generate } from "@/lib/questions";

const best = async (section: string, stem: string, options: string[]) =>
  (await findMatches({ section, normStem: normStem(stem), normOptions: normOptions(options) }))[0];

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  await seedBankFingerprints();
});

describe("similarity against the banks (measured: see README 'Community questions')", () => {
  it("identical → ~1.0", async () => {
    const q = generate("v-correction:0");
    const m = await best("verbal", q.prompt, q.options);
    expect(m.ref).toBe("v-correction:0");
    expect(m.score).toBeGreaterThan(0.99);
  });

  it("same question with options reordered → ≥ DUPLICATE_LIKELY", async () => {
    const q = generate("v-fill:0");
    expect((await best("verbal", q.prompt, [...q.options].reverse())).score).toBeGreaterThanOrEqual(DUPLICATE_LIKELY);
  });

  it("light rewording → between DUPLICATE_POSSIBLE and DUPLICATE_LIKELY", async () => {
    // Measured: 0.77 (options-only, shared instruction line), 0.68 and 0.59.
    const cases = [
      await best("verbal", "Pick the sentence that is grammatically correct.", [
        "Neither the manager nor the staff was ready for the audit.",
        "Neither the manager nor the staff were ready for the audit.",
        "Neither the manager or the staff were ready for the audit.",
        "Neither the manager nor the staff has been ready for the audit.",
      ]),
      await best("verbal", "Fill in the blank: The new rules come into force ___ 1st April.", ["on", "from", "since", "at"]),
      await best("technical", "Which port does HTTPS use by default?", ["443", "80", "21", "25"]),
    ];
    for (const m of cases) {
      expect(m.score).toBeGreaterThanOrEqual(DUPLICATE_POSSIBLE);
      expect(m.score).toBeLessThan(DUPLICATE_LIKELY);
    }
  });

  it("unrelated question in the same section → < DUPLICATE_POSSIBLE", async () => {
    // Measured: 0.29 and 0.33. A shared instruction line alone must not count.
    const a = await best("verbal", "Fill in the blank: The bridge was built ___ the river in 1990.", ["across", "through", "along", "between"]);
    const b = await best("verbal", "Choose the grammatically correct sentence.", ["She is junior than me.", "Whom shall I say is calling?", "The jury has reached its verdict.", "Less people came than expected."]);
    expect(a?.score ?? 0).toBeLessThan(DUPLICATE_POSSIBLE);
    expect(b?.score ?? 0).toBeLessThan(DUPLICATE_POSSIBLE);
  });

  it("only compares within the same section", async () => {
    const q = generate("v-fill:0");
    expect(await findMatches({ section: "technical", normStem: normStem(q.prompt), normOptions: normOptions(q.options) })).toEqual([]);
  });
});
