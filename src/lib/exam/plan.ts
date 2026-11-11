import { randomInt } from "node:crypto";
import { toView } from "@/lib/questions";
import type { QuestionView, Topic } from "@/lib/questions/types";

/**
 * Pure planning helpers for mocks (no DB): which topics fill a section, in what order, and how to
 * recognise a question the student has already seen. Kept separate from service.ts so it is unit-testable.
 */

/** For each topic: how many mocks ago the student last saw it (0 = the latest mock). Missing = never. */
export type MocksAgo = Map<string, number>;

/**
 * Picks `count` topics for one section.
 *
 * - Every topic fits (count >= topics): each topic once, the remaining slots by weight.
 * - Fewer slots than topics: distinct topics only. Topics the student has not seen within the
 *   rotation window are picked first (oldest first), so every topic comes up at least once in any
 *   ceil(topics / count) consecutive mocks. The other slots are a weighted draw, so frequent
 *   topics still show up more often.
 *
 * The result is shuffled, so topics are mixed instead of grouped.
 */
export function planTopics(topics: Topic[], count: number, mocksAgo: MocksAgo = new Map(), rand: () => number = Math.random): Topic[] {
  if (count <= 0 || topics.length === 0) return [];
  // Weighted random key (Efraimidis–Spirakis): sorting by it descending is a weighted draw without replacement.
  const key = new Map(topics.map((t) => [t.id, Math.pow(rand() || Number.MIN_VALUE, 1 / Math.max(t.weight, 0.01))]));
  const byKey = (a: Topic, b: Topic) => key.get(b.id)! - key.get(a.id)!;
  let out: Topic[];

  if (count >= topics.length) {
    out = [...topics];
    const total = topics.reduce((s, t) => s + t.weight, 0);
    const cap = (t: Topic) => Math.ceil((count * t.weight) / total) + 1;
    const used = new Map(topics.map((t) => [t.id, 1]));
    while (out.length < count) {
      let x = rand() * total;
      const t = topics.find((tp) => (x -= tp.weight) < 0) ?? topics[topics.length - 1];
      if (used.get(t.id)! >= cap(t)) continue;
      used.set(t.id, used.get(t.id)! + 1);
      out.push(t);
    }
  } else {
    const window = Math.ceil(topics.length / count) - 1; // seen within this many mocks = not overdue
    const ago = (t: Topic) => mocksAgo.get(t.id) ?? Number.POSITIVE_INFINITY;
    const overdue = topics.filter((t) => ago(t) >= window).sort((a, b) => ago(b) - ago(a) || byKey(a, b));
    const must = overdue.slice(0, count);
    const rest = topics.filter((t) => !must.includes(t)).sort(byKey);
    out = [...must, ...rest.slice(0, count - must.length)];
  }
  return shuffle(out, rand);
}

export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Identity of a question as the student sees it, ignoring option order. Two seeds that render the
 * same question (small generators repeat) get the same fingerprint.
 */
export function fingerprint(q: Pick<QuestionView, "prompt" | "options"> & Partial<QuestionView>): string {
  return JSON.stringify([q.prompt, q.code ?? "", q.passage ?? "", q.grid ?? null, q.table ?? null, q.chart ?? null, [...q.options].sort()]);
}

/** What a student has already been given, used to keep every new attempt fresh. */
export type History = {
  /** Finite banks: bank indices already seen, per topic. */
  seen: Map<string, Set<number>>;
  /** Every question already seen (any mode), by topic, as fingerprints. */
  prints: Map<string, Set<string>>;
  /** Per topic: how many mocks ago it last appeared (0 = latest mock). */
  mocksAgo: MocksAgo;
};

const newSeed = () => randomInt(1, 2 ** 31 - 1);

/** Picks a seed for a topic. Finite banks prefer items the user has not seen yet. */
export function pickSeed(topic: Topic, seen: Map<string, Set<number>>, taken: Set<string>): number {
  if (!topic.poolSize) return newSeed();
  const used = seen.get(topic.id) ?? new Set<number>();
  const fresh = Array.from({ length: topic.poolSize }, (_, i) => i).filter((i) => !used.has(i) && !taken.has(`${topic.id}:${i}`));
  const pool = fresh.length ? fresh : Array.from({ length: topic.poolSize }, (_, i) => i).filter((i) => !taken.has(`${topic.id}:${i}`));
  const index = pool.length ? pool[randomInt(0, pool.length)] : randomInt(0, topic.poolSize);
  taken.add(`${topic.id}:${index}`);
  // Keep the bank index but vary the seed so option order is reshuffled on repeats.
  return index + topic.poolSize * randomInt(0, 10_000);
}

/** Tries per slot to find a question the student has never seen before accepting a repeat. */
const FRESH_TRIES = 40;

/**
 * A seed whose question this student has not seen in any earlier attempt, or earlier in this one.
 * Generators can render the same question from different seeds (small parameter spaces), so this
 * compares what is shown, not the seed. Falls back to a repeat only when the topic is exhausted.
 */
export function pickFresh(topic: Topic, history: History, taken: Set<string>): number {
  const prints = history.prints.get(topic.id) ?? new Set<string>();
  history.prints.set(topic.id, prints);
  let seed = pickSeed(topic, history.seen, taken);
  for (let i = 1; i < FRESH_TRIES; i++) {
    const fp = fingerprint(toView(topic.generate(seed)));
    if (!prints.has(fp)) {
      prints.add(fp);
      return seed;
    }
    seed = pickSeed(topic, history.seen, taken);
  }
  prints.add(fingerprint(toView(topic.generate(seed))));
  return seed;
}
