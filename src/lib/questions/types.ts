export type SectionId = "reasoning" | "math" | "verbal" | "pseudocode" | "puzzle" | "technical" | "writing";

/** What the candidate sees. Safe to send to the browser. */
export interface QuestionView {
  kind: "mcq" | "essay";
  prompt: string;
  /** Optional monospace block (pseudocode, number series layout). */
  code?: string;
  /** Optional reading passage shown above the question. */
  passage?: string;
  /** Optional data table (DI questions). First row is the header. */
  table?: string[][];
  /** Optional number grid for puzzles; null renders as "?", strings render as labels (A, B…). */
  grid?: (number | string | null)[][];
  options: string[];
  /** Essay only. */
  minWords?: number;
  /** Set on community-contributed questions (shown as a badge; `author` is "First L."). */
  community?: { id: string; author: string };
}

/** Full question including the answer. Server-side only. */
export interface Question extends QuestionView {
  answer: number; // index into options; -1 for essays
  explanation: string;
}

export interface Topic {
  id: string;
  section: SectionId;
  label: string;
  /**
   * How often the topic shows up in reported Infosys papers (relative weight inside its section).
   * Used to pick mock questions and to rank recommendations.
   */
  weight: number;
  /** Target seconds per question, used for speed analytics. */
  targetSec: number;
  /** Static banks have a finite pool; generators are effectively unlimited. */
  poolSize?: number;
  generate: (seed: number) => Question;
}
