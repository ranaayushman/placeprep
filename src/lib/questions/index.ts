import { mathTopics } from "./math";
import { pseudocodeTopics } from "./pseudocode";
import { puzzleTopics } from "./puzzle";
import { reasoningTopics } from "./reasoning";
import { technicalTopics } from "./technical";
import type { Question, QuestionView, SectionId, Topic } from "./types";
import { ESSAY_PROMPTS, verbalTopics } from "./verbal";
import { HARD } from "./hard";
import { mixWith, VARIETY } from "./variety";

const essayTopic: Topic = {
  id: "w-essay",
  section: "writing",
  label: "Essay / Email Writing",
  weight: 1,
  targetSec: 1200,
  poolSize: ESSAY_PROMPTS.length,
  generate: (seed) => ({
    kind: "essay",
    prompt: ESSAY_PROMPTS[seed % ESSAY_PROMPTS.length],
    options: [],
    minWords: 150,
    answer: -1,
    explanation:
      "Self-review checklist: clear opening that states your view; 2–3 body paragraphs, each with one idea and an example; a short conclusion; no spelling or tense errors; 150–250 words.",
  }),
};

export const TOPICS: Topic[] = [...reasoningTopics, ...mathTopics, ...verbalTopics, ...pseudocodeTopics, ...puzzleTopics, ...technicalTopics, essayTopic].map((t) => ({
  ...t,
  // Extra standard templates for topics that had only one, then the hard tier where it exists.
  ...(VARIETY[t.id] ? { generate: mixWith(t.generate, VARIETY[t.id]) } : {}),
  ...(HARD[t.id] ? { hard: HARD[t.id] } : {}),
}));
export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

export const SECTION_LABELS: Record<SectionId, string> = {
  reasoning: "Reasoning Ability",
  math: "Mathematical Ability",
  verbal: "Verbal Ability",
  pseudocode: "Pseudocode",
  puzzle: "Numerical Puzzles",
  technical: "Technical (CS Fundamentals)",
  writing: "Writing Test",
};

export const topicsFor = (section: SectionId) => TOPICS.filter((t) => t.section === section);

/** "<topic>:<seed>" is a standard question, "<topic>:<seed>:h" its hard-tier counterpart. */
export function generate(ref: string): Question {
  const [topicId, seedStr, tier] = ref.split(":");
  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) throw new Error(`Unknown topic ${topicId}`);
  return tier === "h" && topic.hard ? topic.hard(Number(seedStr)) : topic.generate(Number(seedStr));
}

export const isHardRef = (ref: string) => ref.split(":")[2] === "h";

/** Strips answer and explanation before anything is sent to the browser. */
export function toView(q: Question): QuestionView {
  const { answer: _a, explanation: _e, ...view } = q;
  return view;
}

export type { Question, QuestionView, SectionId, Topic };
