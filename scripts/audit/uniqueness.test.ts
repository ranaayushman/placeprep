/**
 * Prints, per topic, how many distinct questions 5,000 seeds produce (by prompt, code, passage, grid, table and option set).
 * A low number means students will start seeing repeats after a few mocks, whatever the seed.
 */
import { it } from "vitest";
import { TOPICS } from "@/lib/questions";

const SEEDS = 5000;

it("distinct questions per topic", () => {
  const rows = TOPICS.filter((t) => t.section !== "writing").map((t) => {
    const keys = new Set<string>();
    for (let s = 1; s <= SEEDS; s++) {
      const q = t.generate(s);
      keys.add(JSON.stringify([q.prompt, q.code ?? "", q.passage ?? "", q.grid ?? null, q.table ?? null, [...q.options].sort()]));
    }
    return { topic: t.id, section: t.section, weight: t.weight, poolSize: t.poolSize ?? "gen", distinct: keys.size };
  });
  console.table(rows.sort((a, b) => a.distinct - b.distinct));
}, 120_000);
