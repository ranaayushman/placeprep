import { it, expect } from "vitest";
import { fingerprint, pickFresh, type History } from "@/lib/exam/plan";
import { TOPIC_BY_ID, toView } from "@/lib/questions";

it("a fixed bank never repeats a question inside one attempt, even when most of it was seen before", () => {
  const t = TOPIC_BY_ID.get("t-security")!;
  let worst = 0;
  for (let run = 0; run < 200; run++) {
    const seenPrints = new Set<string>();
    for (let i = 0; i < t.poolSize! - 3; i++) seenPrints.add(fingerprint(toView(t.generate(i))));
    const history: History = { seen: new Map(), prints: new Map([[t.id, seenPrints]]), mocksAgo: new Map() } as History;
    const taken = new Set<string>();
    const refs = Array.from({ length: 10 }, () => pickFresh(t, history, taken));
    const idx = refs.map((r) => Number(r.split(":")[1]) % t.poolSize!);
    worst = Math.max(worst, idx.length - new Set(idx).size);
  }
  expect(worst).toBe(0);
});
