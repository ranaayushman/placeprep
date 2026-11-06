import type { Question } from "./types";

/** Small deterministic PRNG (mulberry32). Same seed => same question, always. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** Integer in [min, max], inclusive. */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    shuffle: <T>(arr: readonly T[]): T[] => {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}
export type Rng = ReturnType<typeof rng>;

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

export function fraction(n: number, d: number) {
  const g = gcd(n, d);
  const [nn, dd] = [n / g, d / g];
  return dd === 1 ? `${nn}` : `${nn}/${dd}`;
}

/** Formats a number without floating-point noise (e.g. 12.5, not 12.499999). */
export function fmt(x: number, digits = 2) {
  return Number(x.toFixed(digits)).toString();
}

/**
 * Builds a 4-option MCQ. Distractors that duplicate the answer (or each other) are dropped and
 * replaced with nearby values, so every generated question has exactly 4 distinct options.
 */
export function mcq(
  r: Rng,
  q: { prompt: string; correct: string; distractors: string[]; explanation: string } & Partial<
    Pick<Question, "code" | "passage" | "table" | "grid">
  >,
  fallback?: (i: number) => string,
): Question {
  const seen = new Set([q.correct]);
  const wrong: string[] = [];
  for (const d of q.distractors) {
    if (wrong.length === 3) break;
    if (!seen.has(d)) {
      seen.add(d);
      wrong.push(d);
    }
  }
  for (let i = 1; wrong.length < 3 && i < 100; i++) {
    const candidate = fallback ? fallback(i) : nudgeFirstNumber(q.correct, i % 2 ? Math.ceil(i / 2) : -Math.ceil(i / 2));
    if (!seen.has(candidate)) {
      seen.add(candidate);
      wrong.push(candidate);
    }
  }
  const options = r.shuffle([q.correct, ...wrong]);
  const { prompt, explanation, code, passage, table, grid } = q;
  return { kind: "mcq", prompt, explanation, code, passage, table, grid, options, answer: options.indexOf(q.correct) };
}

/**
 * Creates a plausible wrong option by shifting the first number in a string, keeping its format:
 * "25% increase" → "26% increase", "2:3" → "3:3", "₹1,200" → "₹1,201".
 */
function nudgeFirstNumber(text: string, delta: number) {
  const m = /-?\d[\d,]*(\.\d+)?/.exec(text);
  if (!m) return `${text} (${delta})`;
  const n = Number(m[0].replace(/,/g, ""));
  const next = n + delta;
  const formatted = m[0].includes(",") ? next.toLocaleString("en-IN") : fmt(next);
  return text.slice(0, m.index) + formatted + text.slice(m.index + m[0].length);
}

/** For static banks where options are already written. Shuffles while tracking the answer. */
export function staticMcq(
  r: Rng,
  item: { prompt: string; options: string[]; answer: number; explanation: string; passage?: string; code?: string },
): Question {
  const order = r.shuffle(item.options.map((_, i) => i));
  return {
    kind: "mcq",
    prompt: item.prompt,
    passage: item.passage,
    code: item.code,
    options: order.map((i) => item.options[i]),
    answer: order.indexOf(item.answer),
    explanation: item.explanation,
  };
}
