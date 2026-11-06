import { mathTopics } from "./math";
import { pseudocodeTopics } from "./pseudocode";
import { puzzleTopics } from "./puzzle";
import { reasoningTopics } from "./reasoning";
import type { Question, QuestionView, SectionId, Topic } from "./types";
import { ESSAY_PROMPTS, verbalTopics } from "./verbal";

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

export const TOPICS: Topic[] = [...reasoningTopics, ...mathTopics, ...verbalTopics, ...pseudocodeTopics, ...puzzleTopics, essayTopic];
export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

export const SECTION_LABELS: Record<SectionId, string> = {
  reasoning: "Reasoning Ability",
  math: "Mathematical Ability",
  verbal: "Verbal Ability",
  pseudocode: "Pseudocode",
  puzzle: "Numerical Puzzles",
  writing: "Writing Test",
};

export const topicsFor = (section: SectionId) => TOPICS.filter((t) => t.section === section);

export function generate(ref: string): Question {
  const [topicId, seedStr] = ref.split(":");
  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) throw new Error(`Unknown topic ${topicId}`);
  return topic.generate(Number(seedStr));
}

/** Strips answer and explanation before anything is sent to the browser. */
export function toView(q: Question): QuestionView {
  const { answer: _a, explanation: _e, ...view } = q;
  return view;
}

export type { Question, QuestionView, SectionId, Topic };
