import { PROBLEMS, type Problem } from "@/lib/code/problems";
import type { Question, Topic } from "./types";

/**
 * Coding problems as topics, so mocks plan, serve and track them like any other question
 * (fresh picks per student, history, analytics). The answer is judged by running the code
 * (lib/exam/service.ts submitCodeAnswer): answerIndex 1 = accepted sentinel; chosenIndex is set to
 * 1 when every hidden test passes and 0 when a submission fails, so scoring needs no special case.
 */
export const CODE_ACCEPTED = 1;

const toQuestion = (p: Problem): Question => ({
  kind: "code",
  prompt: p.statement,
  problem: { id: p.id, difficulty: p.difficulty, input: p.input, output: p.output, constraints: p.constraints, samples: p.samples },
  options: [],
  answer: CODE_ACCEPTED,
  explanation: "Accepted when the program prints the expected output for every hidden test within the time limit.",
});

const topic = (id: string, label: string, tier: Problem["tier"], targetSec: number): Topic => {
  const pool = PROBLEMS.filter((p) => p.tier === tier);
  return { id, section: "coding", label, weight: 1, targetSec, poolSize: pool.length, generate: (seed) => toQuestion(pool[seed % pool.length]) };
};

export const codingTopics: Topic[] = [
  topic("c-nugget", "Coding nugget (short problem)", "nugget", 600),
  topic("c-program", "Coding program (medium problem)", "program", 900),
];
