/**
 * Static hard tiers for topics that are fixed banks (verbal, technical) or had no hard generator.
 * Written for the Cognizant GenC mocks, which aim 1.5–2× above the real paper; every other exam and
 * practice mode that uses these topics gets them too. Original items, one correct option each,
 * every code output produced by actually running the code.
 */
import { HARD_DEBUG_ALL } from "./genc-hard-debug";
import { HARD_ALPHA, HARD_STATEMENT } from "./genc-hard-reasoning";
import { HARD_CLOUD, HARD_DBMS, HARD_JAVA, HARD_PYTHON } from "./genc-hard-tech";
import { HARD_CORRECTION, HARD_ERROR, HARD_FILL, HARD_JUMBLE, HARD_VOCAB } from "./genc-hard-verbal";

export type HardItem = { lang?: string; prompt: string; code?: string; options: string[]; answer: number; explanation: string };

/** Topic id → its hard bank. Debugging follows the cluster split in genc.ts (Java cluster drops Python, Python cluster drops Java). */
export const STATIC_HARD: Record<string, HardItem[]> = {
  "v-correction": HARD_CORRECTION,
  "v-fill": HARD_FILL,
  "v-vocab": HARD_VOCAB,
  "v-error": HARD_ERROR,
  "v-jumble": HARD_JUMBLE,
  "r-alpha": HARD_ALPHA,
  "r-statement": HARD_STATEMENT,
  "t-java": HARD_JAVA,
  "t-python": HARD_PYTHON,
  "t-dbms": HARD_DBMS,
  "t-cloud": HARD_CLOUD,
  "t-debug": HARD_DEBUG_ALL.filter((q) => q.lang !== "Python"),
  "t-debug-py": HARD_DEBUG_ALL.filter((q) => q.lang !== "Java"),
};
