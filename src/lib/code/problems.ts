/**
 * C++ / Java practice problems for the coding section (Deloitte NLA style: one "coding nugget" and one
 * fuller program; arrays, strings, bits and maths; easy to medium). Statements are original. The nugget
 * pool follows the problem types PrepInsta and Let's Code both report from real NLA papers (move zeros,
 * toggle bits, count within a difference, difference of sums, sort 0/1/2, perfect number, sum of two primes,
 * class monitor, string alternation); the program pool follows the medium ones they list (K set bits,
 * odd-sum subarrays, longest palindromic substring, Kth largest, inversions). Every sample is also a hidden test.
 */
export type Language = "cpp" | "java";
export const LANGUAGES: Record<Language, string> = { cpp: "C++17", java: "Java" };
/** Wall-clock limit per run; the JVM needs start-up time. */
export const RUN_MS: Record<Language, number> = { cpp: 2_000, java: 4_000 };

export type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium";
  /** Deloitte NLA serves one "coding nugget" (short, function-level) and one fuller "program" per paper. */
  tier: "nugget" | "program";
  tags: string[];
  statement: string;
  input: string;
  output: string;
  constraints: string;
  samples: { input: string; output: string; note?: string }[];
  /** Hidden tests, run on Submit. Samples are prepended automatically. */
  tests: { input: string; output: string }[];
};

export const STARTER_CODE = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        PrintWriter out = new PrintWriter(System.out);

        out.flush();
    }
}
`,
};

/** Trailing spaces on each line and trailing blank lines do not matter; everything else does. */
export const normalizeOutput = (s: string) =>
  s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");

export const PROBLEMS: Problem[] = [
  {
    id: "move-zeros",
    title: "Move the empty packets to the end",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["arrays"],
    statement: "A conveyor belt carries N packets. A packet's weight is 0 when it is empty. Move every empty packet to the end of the belt while keeping the other packets in their original order.",
    input: "The first line has N. The second line has N integers, the weights.",
    output: "The N weights after rearrangement, separated by single spaces.",
    constraints: "1 ≤ N ≤ 10^5, 0 ≤ weight ≤ 10^9",
    samples: [
      { input: "8\n4 5 0 1 9 0 5 0\n", output: "4 5 1 9 5 0 0 0\n" },
      { input: "6\n6 0 1 8 0 2\n", output: "6 1 8 2 0 0\n" },
    ],
    tests: [
      { input: "4\n0 0 0 0\n", output: "0 0 0 0\n" },
      { input: "3\n7 8 9\n", output: "7 8 9\n" },
      { input: "1\n0\n", output: "0\n" },
      { input: "7\n0 3 0 0 2 1 0\n", output: "3 2 1 0 0 0 0\n" },
    ],
  },
  {
    id: "toggle-bits",
    title: "Toggle every bit",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["bit manipulation"],
    statement: "Given a positive integer N, write it in binary without leading zeros, flip every bit (0 becomes 1 and 1 becomes 0), and print the resulting number in decimal.",
    input: "A single integer N.",
    output: "The toggled number.",
    constraints: "1 ≤ N ≤ 10^9",
    samples: [{ input: "10\n", output: "5\n", note: "10 is 1010 in binary; flipping gives 0101, which is 5." }],
    tests: [
      { input: "7\n", output: "0\n" },
      { input: "1\n", output: "0\n" },
      { input: "100\n", output: "27\n" },
      { input: "8\n", output: "7\n" },
      { input: "1000000000\n", output: "73741823\n" },
    ],
  },
  {
    id: "count-near",
    title: "Count values near a target",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["arrays"],
    statement: "Given an array, a target value num and a tolerance diff, count how many elements x satisfy |x − num| ≤ diff. If no element qualifies, print -1.",
    input: "The first line has N. The second line has N integers. The third line has num and diff.",
    output: "The count, or -1 when it is zero.",
    constraints: "1 ≤ N ≤ 10^5, −10^9 ≤ values ≤ 10^9, 0 ≤ diff ≤ 10^9",
    samples: [{ input: "6\n12 3 14 56 77 13\n13 2\n", output: "3\n", note: "12, 13 and 14 are within 2 of 13." }],
    tests: [
      { input: "4\n1 2 3 4\n10 1\n", output: "-1\n" },
      { input: "5\n5 5 5 5 5\n5 0\n", output: "5\n" },
      { input: "3\n-10 0 10\n0 10\n", output: "3\n" },
      { input: "1\n100\n99 0\n", output: "-1\n" },
    ],
  },
  {
    id: "difference-of-sums",
    title: "Difference of two sums",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["math", "loops"],
    statement: "Given n and m, consider the integers from 1 to m. Let A be the sum of the integers NOT divisible by n and B the sum of the integers divisible by n. Print A − B.",
    input: "Two integers n and m on one line.",
    output: "The value of A − B (it may be negative).",
    constraints: "1 ≤ n, m ≤ 10^6",
    samples: [
      { input: "4 20\n", output: "90\n", note: "Divisible by 4: 4+8+12+16+20 = 60. The rest sum to 150. 150 − 60 = 90." },
      { input: "3 10\n", output: "19\n" },
    ],
    tests: [
      { input: "5 5\n", output: "5\n" },
      { input: "1 10\n", output: "-55\n" },
      { input: "7 6\n", output: "21\n" },
      { input: "2 1000000\n", output: "-500000\n" },
    ],
  },
  {
    id: "sort-012",
    title: "Sort the risk levels",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["arrays", "sorting"],
    statement: "Every passenger at an airport gate is given a risk level 0, 1 or 2. Print the levels in non-decreasing order. (A single pass without sorting, counting each value, is the intended solution.)",
    input: "The first line has N. The second line has N integers, each 0, 1 or 2.",
    output: "The N values in sorted order, separated by single spaces.",
    constraints: "1 ≤ N ≤ 10^5",
    samples: [
      { input: "7\n1 0 2 0 1 0 2\n", output: "0 0 0 1 1 2 2\n" },
      { input: "10\n2 1 0 2 1 0 0 1 2 0\n", output: "0 0 0 0 1 1 1 2 2 2\n" },
    ],
    tests: [
      { input: "3\n2 2 2\n", output: "2 2 2\n" },
      { input: "1\n1\n", output: "1\n" },
      { input: "5\n2 1 2 1 0\n", output: "0 1 1 2 2\n" },
    ],
  },
  {
    id: "reverse-words",
    title: "Reverse the words",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["strings"],
    statement: "Given a sentence, print its words in reverse order. Words are separated by single spaces.",
    input: "One line containing 1 to 100 words made of letters and digits.",
    output: "The words in reverse order, separated by single spaces.",
    constraints: "Line length ≤ 1000",
    samples: [{ input: "campus placement season 2027\n", output: "2027 season placement campus\n" }],
    tests: [
      { input: "hello\n", output: "hello\n" },
      { input: "a b c d e\n", output: "e d c b a\n" },
      { input: "Deloitte NLA coding round\n", output: "round coding NLA Deloitte\n" },
    ],
  },
  {
    id: "second-largest",
    title: "Second largest distinct value",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["arrays"],
    statement: "Print the second largest distinct value in the array. If every value is the same, print -1.",
    input: "The first line has N. The second line has N integers.",
    output: "The second largest distinct value, or -1.",
    constraints: "1 ≤ N ≤ 10^5, −10^9 ≤ values ≤ 10^9",
    samples: [{ input: "6\n4 9 1 9 7 4\n", output: "7\n" }],
    tests: [
      { input: "3\n5 5 5\n", output: "-1\n" },
      { input: "1\n42\n", output: "-1\n" },
      { input: "4\n-1 -2 -3 -1\n", output: "-2\n" },
      { input: "5\n1 2 3 4 5\n", output: "4\n" },
    ],
  },
  {
    id: "palindrome",
    title: "Is it a palindrome?",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["strings", "two pointers"],
    statement: "A string is a palindrome if it reads the same forwards and backwards, ignoring case and ignoring every character that is not a letter or a digit. Print YES or NO.",
    input: "One line, up to 1000 characters, possibly with spaces and punctuation.",
    output: "YES or NO.",
    constraints: "Length ≤ 1000",
    samples: [{ input: "Was it a car or a cat I saw\n", output: "YES\n" }],
    tests: [
      { input: "race a car\n", output: "NO\n" },
      { input: "A man, a plan, a canal: Panama\n", output: "YES\n" },
      { input: "x\n", output: "YES\n" },
      { input: "12321\n", output: "YES\n" },
      { input: "ab\n", output: "NO\n" },
    ],
  },
  {
    id: "max-subarray",
    title: "Maximum subarray sum",
    difficulty: "Medium",
    tier: "program",
    tags: ["arrays", "dynamic programming"],
    statement: "Find the largest possible sum of a contiguous, non-empty subarray.",
    input: "The first line has N. The second line has N integers.",
    output: "The maximum subarray sum.",
    constraints: "1 ≤ N ≤ 10^5, −10^4 ≤ values ≤ 10^4",
    samples: [{ input: "9\n-2 1 -3 4 -1 2 1 -5 4\n", output: "6\n", note: "4 + (−1) + 2 + 1 = 6." }],
    tests: [
      { input: "3\n-5 -2 -8\n", output: "-2\n" },
      { input: "1\n7\n", output: "7\n" },
      { input: "5\n1 2 3 4 5\n", output: "15\n" },
      { input: "6\n5 -9 6 -2 3 -1\n", output: "7\n" },
    ],
  },
  {
    id: "balanced-brackets",
    title: "Balanced brackets",
    difficulty: "Medium",
    tier: "program",
    tags: ["strings", "stack"],
    statement: "A string of the characters ( ) [ ] { } is balanced if every opening bracket is closed by the same type of bracket in the correct order. Print YES if the string is balanced, otherwise NO.",
    input: "One line containing only bracket characters.",
    output: "YES or NO.",
    constraints: "1 ≤ length ≤ 10^5",
    samples: [
      { input: "{[()]}\n", output: "YES\n" },
      { input: "([)]\n", output: "NO\n" },
    ],
    tests: [
      { input: "(((\n", output: "NO\n" },
      { input: "()[]{}\n", output: "YES\n" },
      { input: "}\n", output: "NO\n" },
      { input: "{[()()]}[]\n", output: "YES\n" },
      { input: "(()\n", output: "NO\n" },
    ],
  },
  {
    id: "perfect-number",
    title: "Perfect number",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["math", "loops"],
    statement: "A number is perfect when the sum of its proper divisors (all divisors except itself) equals the number. Print Perfect or Not Perfect.",
    input: "A single integer N.",
    output: "Perfect or Not Perfect.",
    constraints: "1 ≤ N ≤ 10^7",
    samples: [{ input: "28\n", output: "Perfect\n", note: "1 + 2 + 4 + 7 + 14 = 28." }],
    tests: [
      { input: "6\n", output: "Perfect\n" },
      { input: "12\n", output: "Not Perfect\n" },
      { input: "1\n", output: "Not Perfect\n" },
      { input: "496\n", output: "Perfect\n" },
      { input: "27\n", output: "Not Perfect\n" },
    ],
  },
  {
    id: "sum-of-two-primes",
    title: "Sum of two primes",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["math", "primes"],
    statement: "Every even number greater than 2 can be written as the sum of two primes. Given an even N, print the pair whose first prime is the smallest possible.",
    input: "A single even integer N.",
    output: "The two primes in the form \"p and q\" with p ≤ q.",
    constraints: "4 ≤ N ≤ 10^6, N is even",
    samples: [{ input: "34\n", output: "3 and 31\n", note: "2 + 32 fails (32 is not prime); 3 + 31 works." }],
    tests: [
      { input: "4\n", output: "2 and 2\n" },
      { input: "10\n", output: "3 and 7\n" },
      { input: "28\n", output: "5 and 23\n" },
      { input: "100\n", output: "3 and 97\n" },
      { input: "98\n", output: "19 and 79\n" },
    ],
  },
  {
    id: "class-monitor",
    title: "Class monitor changes",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["arrays"],
    statement: "Students stand in a line with their exam ranks. The first student becomes the class monitor. Walking down the line, whenever a student has a better (smaller) rank than the current monitor, that student becomes the monitor. Print how many times the monitor changed.",
    input: "The first line has N. The second line has N distinct ranks.",
    output: "The number of changes.",
    constraints: "1 ≤ N ≤ 10^5, 1 ≤ rank ≤ 10^9",
    samples: [{ input: "6\n4 3 7 2 6 1\n", output: "3\n", note: "Monitor goes 4 → 3 → 2 → 1: three changes." }],
    tests: [
      { input: "3\n1 2 3\n", output: "0\n" },
      { input: "4\n9 8 7 6\n", output: "3\n" },
      { input: "1\n5\n", output: "0\n" },
      { input: "5\n3 5 1 4 2\n", output: "1\n" },
    ],
  },
  {
    id: "string-alternation",
    title: "Merge two strings alternately",
    difficulty: "Easy",
    tier: "nugget",
    tags: ["strings"],
    statement: "Merge two strings by taking characters alternately, starting with the first string. When one string runs out, append the rest of the other.",
    input: "Two lines, one non-empty string each, without spaces.",
    output: "The merged string.",
    constraints: "1 ≤ length ≤ 1000",
    samples: [{ input: "ab\nxyz\n", output: "axbyz\n" }],
    tests: [
      { input: "code\nrun\n", output: "croudne\n" },
      { input: "a\nb\n", output: "ab\n" },
      { input: "abc\nabc\n", output: "aabbcc\n" },
      { input: "Deloitte\nNLA\n", output: "DNeLlAoitte\n" },
    ],
  },
  {
    id: "k-set-bits",
    title: "Numbers with K set bits",
    difficulty: "Medium",
    tier: "program",
    tags: ["bit manipulation"],
    statement: "Count the integers x with 1 ≤ x < N whose binary representation has exactly K ones.",
    input: "Two integers N and K on one line.",
    output: "The count.",
    constraints: "1 ≤ N ≤ 10^6, 1 ≤ K ≤ 20",
    samples: [{ input: "7 2\n", output: "3\n", note: "3 (011), 5 (101) and 6 (110)." }],
    tests: [
      { input: "1 1\n", output: "0\n" },
      { input: "8 3\n", output: "1\n" },
      { input: "16 1\n", output: "4\n" },
      { input: "100 4\n", output: "26\n" },
      { input: "1000000 20\n", output: "0\n" },
    ],
  },
  {
    id: "odd-sum-subarrays",
    title: "Subarrays with an odd sum",
    difficulty: "Medium",
    tier: "program",
    tags: ["arrays", "prefix sums"],
    statement: "Count the contiguous subarrays whose elements sum to an odd number.",
    input: "The first line has N. The second line has N integers.",
    output: "The count (it can exceed the 32-bit range).",
    constraints: "1 ≤ N ≤ 10^5, 1 ≤ values ≤ 100",
    samples: [{ input: "3\n1 3 5\n", output: "4\n", note: "[1], [3], [5] and [1 3 5]." }],
    tests: [
      { input: "3\n2 4 6\n", output: "0\n" },
      { input: "1\n1\n", output: "1\n" },
      { input: "4\n1 2 3 4\n", output: "6\n" },
      { input: "5\n1 1 1 1 1\n", output: "9\n" },
    ],
  },
  {
    id: "longest-palindrome",
    title: "Longest palindromic substring",
    difficulty: "Medium",
    tier: "program",
    tags: ["strings"],
    statement: "Print the length of the longest substring that reads the same forwards and backwards.",
    input: "One line, a string of lowercase letters.",
    output: "The length.",
    constraints: "1 ≤ length ≤ 2000",
    samples: [{ input: "babad\n", output: "3\n", note: "\"bab\" or \"aba\"." }],
    tests: [
      { input: "cbbd\n", output: "2\n" },
      { input: "a\n", output: "1\n" },
      { input: "forgeeksskeeg\n", output: "10\n" },
      { input: "abacdfgdcaba\n", output: "3\n" },
      { input: "aaaa\n", output: "4\n" },
    ],
  },
  {
    id: "kth-largest",
    title: "Kth largest element",
    difficulty: "Medium",
    tier: "program",
    tags: ["arrays", "sorting"],
    statement: "Print the Kth largest element of the array, counting duplicates separately (the Kth element when sorted in non-increasing order).",
    input: "The first line has N and K. The second line has N integers.",
    output: "The Kth largest element.",
    constraints: "1 ≤ K ≤ N ≤ 10^5, −10^9 ≤ values ≤ 10^9",
    samples: [{ input: "6 2\n3 2 1 5 6 4\n", output: "5\n" }],
    tests: [
      { input: "9 4\n3 2 3 1 2 4 5 5 6\n", output: "4\n" },
      { input: "1 1\n7\n", output: "7\n" },
      { input: "5 5\n1 2 3 4 5\n", output: "1\n" },
      { input: "4 2\n-1 -1 -2 -3\n", output: "-1\n" },
    ],
  },
  {
    id: "count-inversions",
    title: "Count inversions",
    difficulty: "Medium",
    tier: "program",
    tags: ["arrays", "divide and conquer"],
    statement: "An inversion is a pair of positions i < j with a[i] > a[j]. Count the inversions in the array.",
    input: "The first line has N. The second line has N integers.",
    output: "The number of inversions (it can exceed the 32-bit range).",
    constraints: "1 ≤ N ≤ 10^5, −10^9 ≤ values ≤ 10^9",
    samples: [{ input: "5\n2 4 1 3 5\n", output: "3\n", note: "(2,1), (4,1) and (4,3)." }],
    tests: [
      { input: "3\n1 2 3\n", output: "0\n" },
      { input: "3\n3 2 1\n", output: "3\n" },
      { input: "5\n5 4 3 2 1\n", output: "10\n" },
      { input: "1\n9\n", output: "0\n" },
      { input: "4\n8 4 2 1\n", output: "6\n" },
    ],
  },
];

export type RunStatus = "ok" | "compile_error" | "runtime_error" | "timeout" | "output_limit";
const STATUS: Record<RunStatus, string> = { ok: "Accepted", compile_error: "Compile Error", runtime_error: "Runtime Error", timeout: "Time Limit Exceeded", output_limit: "Output Limit Exceeded" };
/** LeetCode-style verdict for one run; without an expected output any clean run is "Accepted". */
export const verdict = (r: { status: RunStatus; stdout: string }, expected?: string) =>
  r.status !== "ok" ? STATUS[r.status] : expected !== undefined && normalizeOutput(r.stdout) !== normalizeOutput(expected) ? "Wrong Answer" : "Accepted";

/** What a test stores as the answer to a coding question (attempt_questions.text_answer, as JSON). */
export type CodeAnswer = { language: Language; code: string; passed: number; total: number };
export const parseCodeAnswer = (s: string | null | undefined): CodeAnswer | null => {
  try {
    const v = s ? (JSON.parse(s) as CodeAnswer) : null;
    return v && typeof v.code === "string" && v.language in LANGUAGES ? v : null;
  } catch {
    return null;
  }
};

export const PROBLEM_BY_ID = new Map(PROBLEMS.map((p) => [p.id, p]));
/** All tests for a problem, samples first, so a wrong answer is shown on a visible case when possible. */
export const allTests = (p: Problem) => [...p.samples.map(({ input, output }) => ({ input, output })), ...p.tests];
