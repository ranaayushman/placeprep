import type { Problem } from "./problems";

/**
 * Personal DSA track (C++), added a few problems at a time as topics are learned. Separate tier so these
 * never enter the mock-test pools (lib/questions/code-problems.ts picks by tier). `topic` groups the list
 * on /code; statements are original. Hints are given in chat, not on the page, so each problem is tried cold.
 */
export type DsaProblem = Problem & { tier: "dsa"; topic: string };

export const DSA_PROBLEMS: DsaProblem[] = [
  // ── Day 1 · Arrays: traversal and two pointers ────────────────────────────
  {
    id: "dsa-min-max",
    title: "Coldest and hottest day",
    difficulty: "Easy",
    tier: "dsa",
    topic: "Arrays · Day 1",
    tags: ["arrays", "traversal"],
    statement: "A weather station logged the temperature on N days. Print the lowest and the highest temperature. Do it in a single pass over the array, without sorting.",
    input: "The first line has N. The second line has N integers, the temperatures.",
    output: "Two integers separated by a space: the minimum, then the maximum.",
    constraints: "1 ≤ N ≤ 10^5, -10^9 ≤ temperature ≤ 10^9",
    samples: [{ input: "5\n12 -3 40 7 7\n", output: "-3 40\n" }],
    tests: [
      { input: "1\n5\n", output: "5 5\n" },
      { input: "4\n-7 -2 -9 -4\n", output: "-9 -2\n" },
      { input: "3\n-1000000000 0 1000000000\n", output: "-1000000000 1000000000\n" },
      { input: "6\n3 3 3 3 3 3\n", output: "3 3\n" },
    ],
  },
  {
    id: "dsa-reverse-array",
    title: "Reverse the queue",
    difficulty: "Easy",
    tier: "dsa",
    topic: "Arrays · Day 1",
    tags: ["arrays", "two pointers"],
    statement: "N people stand in a queue. Reverse their order in place: use no second array, only swaps. Print the queue after reversing.",
    input: "The first line has N. The second line has N integers.",
    output: "The N integers in reversed order, separated by single spaces.",
    constraints: "1 ≤ N ≤ 10^5, |value| ≤ 10^9",
    samples: [
      { input: "5\n1 2 3 4 5\n", output: "5 4 3 2 1\n" },
      { input: "4\n10 -20 30 -40\n", output: "-40 30 -20 10\n" },
    ],
    tests: [
      { input: "1\n9\n", output: "9\n" },
      { input: "2\n1 2\n", output: "2 1\n" },
      { input: "6\n4 4 1 4 4 1\n", output: "1 4 4 1 4 4\n" },
    ],
  },
  {
    id: "dsa-is-sorted",
    title: "Is the ranking in order?",
    difficulty: "Easy",
    tier: "dsa",
    topic: "Arrays · Day 1",
    tags: ["arrays", "traversal"],
    statement: "Given N scores, print YES if they are in non-decreasing order (each score is at least the one before it) and NO otherwise.",
    input: "The first line has N. The second line has N integers.",
    output: "YES or NO.",
    constraints: "1 ≤ N ≤ 10^5, |value| ≤ 10^9",
    samples: [
      { input: "5\n1 2 2 5 9\n", output: "YES\n" },
      { input: "4\n3 5 4 8\n", output: "NO\n" },
    ],
    tests: [
      { input: "1\n42\n", output: "YES\n" },
      { input: "3\n7 7 7\n", output: "YES\n" },
      { input: "2\n2 1\n", output: "NO\n" },
      { input: "5\n-5 -3 0 0 -1\n", output: "NO\n" },
      { input: "4\n-1000000000 0 999999999 1000000000\n", output: "YES\n" },
    ],
  },
  {
    id: "dsa-max-consecutive-ones",
    title: "Longest streak",
    difficulty: "Easy",
    tier: "dsa",
    topic: "Arrays · Day 1",
    tags: ["arrays", "traversal"],
    statement: "A habit tracker stores 1 for a day you practised and 0 for a day you skipped. Print the length of your longest run of consecutive 1s.",
    input: "The first line has N. The second line has N values, each 0 or 1.",
    output: "One integer: the longest streak (0 if there is no 1).",
    constraints: "1 ≤ N ≤ 10^5",
    samples: [{ input: "9\n1 1 0 1 1 1 0 0 1\n", output: "3\n" }],
    tests: [
      { input: "4\n0 0 0 0\n", output: "0\n" },
      { input: "5\n1 1 1 1 1\n", output: "5\n" },
      { input: "6\n0 1 1 0 1 1\n", output: "2\n" },
      { input: "7\n1 0 1 1 0 1 1\n", output: "2\n" },
      { input: "8\n0 0 1 1 1 1 1 0\n", output: "5\n" },
    ],
  },
  {
    id: "dsa-remove-duplicates-sorted",
    title: "Unique roll numbers",
    difficulty: "Medium",
    tier: "dsa",
    topic: "Arrays · Day 1",
    tags: ["arrays", "two pointers"],
    statement: "A sorted list of N roll numbers has repeats. Keep one copy of each, in place, in O(N) time and O(1) extra space (no set, no second array). Print how many unique values there are, then the unique values.",
    input: "The first line has N. The second line has N integers in non-decreasing order.",
    output: "First line: K, the number of unique values. Second line: the K values, separated by single spaces.",
    constraints: "1 ≤ N ≤ 10^5, |value| ≤ 10^9",
    samples: [{ input: "8\n1 1 2 3 3 3 7 9\n", output: "5\n1 2 3 7 9\n" }],
    tests: [
      { input: "1\n4\n", output: "1\n4\n" },
      { input: "5\n6 6 6 6 6\n", output: "1\n6\n" },
      { input: "4\n-3 -1 0 2\n", output: "4\n-3 -1 0 2\n" },
      { input: "7\n-2 -2 0 0 0 5 5\n", output: "3\n-2 0 5\n" },
    ],
  },
  {
    id: "dsa-rotate-right",
    title: "Rotate the carousel",
    difficulty: "Medium",
    tier: "dsa",
    topic: "Arrays · Day 1",
    tags: ["arrays", "reversal", "modulo"],
    statement: "A carousel holds N items. Rotate it to the right K times: each rotation moves the last item to the front. Print the items after all K rotations. K can be far larger than N, so moving one step at a time will be too slow.",
    input: "The first line has N and K. The second line has N integers.",
    output: "The N integers after rotation, separated by single spaces.",
    constraints: "1 ≤ N ≤ 10^5, 0 ≤ K ≤ 10^9, |value| ≤ 10^9",
    samples: [
      { input: "7 3\n1 2 3 4 5 6 7\n", output: "5 6 7 1 2 3 4\n", note: "After 1: 7 1 2 3 4 5 6. After 2: 6 7 1 2 3 4 5. After 3: 5 6 7 1 2 3 4." },
      { input: "3 0\n4 5 6\n", output: "4 5 6\n" },
    ],
    tests: [
      { input: "1 5\n8\n", output: "8\n" },
      { input: "4 4\n1 2 3 4\n", output: "1 2 3 4\n" },
      { input: "5 7\n1 2 3 4 5\n", output: "4 5 1 2 3\n" },
      { input: "5 1000000000\n10 20 30 40 50\n", output: "10 20 30 40 50\n" },
      { input: "6 999999999\n1 2 3 4 5 6\n", output: "4 5 6 1 2 3\n" },
      { input: "20 999999999\n1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20\n", output: "2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 1\n" },
    ],
  },
];
