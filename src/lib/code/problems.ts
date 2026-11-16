/**
 * C++ / Java practice problems for the coding section (Deloitte NLA style: one "coding nugget" and one
 * fuller program; arrays, strings, bits and maths; easy to medium). Statements are original. The nugget
 * pool follows the problem types PrepInsta and Let's Code both report from real NLA papers (move zeros,
 * toggle bits, count within a difference, difference of sums, sort 0/1/2, perfect number, sum of two primes,
 * class monitor, string alternation); the program pool follows the medium ones they list (K set bits,
 * odd-sum subarrays, longest palindromic substring, Kth largest, inversions). Every sample is also a hidden test.
 */
import { DSA_PROBLEMS } from "./dsa";

export type Language = "cpp" | "java" | "python" | "sql";
export const LANGUAGES: Record<Language, string> = { cpp: "C++17", java: "Java", python: "Python 3", sql: "SQL (SQLite)" };
/** Wall-clock limit per run; the JVM needs start-up time. */
export const RUN_MS: Record<Language, number> = { cpp: 2_000, java: 4_000, python: 4_000, sql: 2_000 };

export type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium";
  /** Deloitte NLA serves one "coding nugget" (short, function-level) and one fuller "program" per paper. */
  tier: "nugget" | "program" | "genc" | "sql" | "dsa";
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
  python: `import sys

def main():
    data = sys.stdin.read().split()
    

main()
`,
  sql: `-- The tables are already created and filled. Write your query:
SELECT
`,
};

/** SQL problems take only SQL; the rest take the compiled languages. */
export const languagesFor = (p: Pick<Problem, "tier">): Language[] => (p.tier === "sql" ? ["sql"] : ["cpp", "java", "python"]);

/** Trailing spaces on each line and trailing blank lines do not matter; everything else does. */
export const normalizeOutput = (s: string) =>
  s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");

const PLACEMENT_PROBLEMS: Problem[] = [
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
  // ── Cognizant GenC style: string and array basics, as reported from the technical round ──
  {
    id: "char-frequency",
    title: "Character frequency",
    difficulty: "Easy",
    tier: "genc",
    tags: ["strings", "hashing"],
    statement: "Print how many times each character occurs in the string, in the order in which the characters first appear.",
    input: "One line, a string of lowercase letters.",
    output: "One line per distinct character: the character, a space, its count.",
    constraints: "1 ≤ length ≤ 10^5",
    samples: [{ input: "hello\n", output: "h 1\ne 1\nl 2\no 1\n" }],
    tests: [
      { input: "aabbcc\n", output: "a 2\nb 2\nc 2\n" },
      { input: "z\n", output: "z 1\n" },
      { input: "banana\n", output: "b 1\na 3\nn 2\n" },
      { input: "mississippi\n", output: "m 1\ni 4\ns 4\np 2\n" },
    ],
  },
  {
    id: "string-match",
    title: "Count pattern occurrences",
    difficulty: "Easy",
    tier: "genc",
    tags: ["strings"],
    statement: "Count how many times the pattern occurs in the text. Occurrences may overlap.",
    input: "Two lines: the text, then the pattern. Lowercase letters only.",
    output: "The number of occurrences.",
    constraints: "1 ≤ |pattern| ≤ |text| ≤ 10^4",
    samples: [{ input: "ababab\naba\n", output: "2\n", note: "At positions 0 and 2 (overlapping)." }],
    tests: [
      { input: "aaaa\naa\n", output: "3\n" },
      { input: "hello\nxyz\n", output: "0\n" },
      { input: "abcabcabc\nabc\n", output: "3\n" },
      { input: "a\na\n", output: "1\n" },
    ],
  },
  {
    id: "first-non-repeating",
    title: "First non-repeating character",
    difficulty: "Easy",
    tier: "genc",
    tags: ["strings", "hashing"],
    statement: "Print the first character that occurs exactly once in the string. If every character repeats, print -1.",
    input: "One line, a string of lowercase letters.",
    output: "A single character, or -1.",
    constraints: "1 ≤ length ≤ 10^5",
    samples: [{ input: "swiss\n", output: "w\n" }],
    tests: [
      { input: "aabb\n", output: "-1\n" },
      { input: "placement\n", output: "p\n" },
      { input: "aabbc\n", output: "c\n" },
      { input: "x\n", output: "x\n" },
      { input: "geeksforgeeks\n", output: "f\n" },
    ],
  },
  {
    id: "missing-number",
    title: "Missing number",
    difficulty: "Easy",
    tier: "genc",
    tags: ["arrays", "math"],
    statement: "The integers 1 to N were written down, but one is missing. Print it.",
    input: "The first line has N. The second line has the N−1 remaining integers in any order.",
    output: "The missing integer.",
    constraints: "1 ≤ N ≤ 10^5",
    samples: [{ input: "5\n1 2 4 5\n", output: "3\n" }],
    tests: [
      { input: "2\n2\n", output: "1\n" },
      { input: "2\n1\n", output: "2\n" },
      { input: "6\n6 5 4 2 1\n", output: "3\n" },
      { input: "1\n\n", output: "1\n" },
    ],
  },
  {
    id: "merge-sorted",
    title: "Merge two sorted arrays",
    difficulty: "Easy",
    tier: "genc",
    tags: ["arrays", "two pointers"],
    statement: "Merge two arrays that are each sorted in non-decreasing order into one sorted array.",
    input: "Line 1: n. Line 2: n sorted integers. Line 3: m. Line 4: m sorted integers.",
    output: "The n+m integers in non-decreasing order, separated by single spaces.",
    constraints: "0 ≤ n, m ≤ 10^5, n+m ≥ 1",
    samples: [{ input: "3\n1 3 5\n3\n2 4 6\n", output: "1 2 3 4 5 6\n" }],
    tests: [
      { input: "1\n5\n1\n5\n", output: "5 5\n" },
      { input: "2\n1 2\n0\n\n", output: "1 2\n" },
      { input: "3\n-3 -1 0\n2\n-2 4\n", output: "-3 -2 -1 0 4\n" },
    ],
  },
  {
    id: "symmetric-matrix",
    title: "Symmetric matrix",
    difficulty: "Easy",
    tier: "genc",
    tags: ["matrix"],
    statement: "A square matrix is symmetric when it equals its own transpose, i.e. A[i][j] = A[j][i] for all i, j. Print YES or NO.",
    input: "The first line has N. Then N lines of N integers.",
    output: "YES or NO.",
    constraints: "1 ≤ N ≤ 300",
    samples: [{ input: "3\n1 2 3\n2 5 6\n3 6 9\n", output: "YES\n" }],
    tests: [
      { input: "2\n1 2\n3 1\n", output: "NO\n" },
      { input: "1\n7\n", output: "YES\n" },
      { input: "2\n1 2\n2 1\n", output: "YES\n" },
      { input: "3\n1 0 0\n0 1 0\n1 0 1\n", output: "NO\n" },
    ],
  },
  {
    id: "pairs-target-sum",
    title: "Pairs with a given sum",
    difficulty: "Medium",
    tier: "genc",
    tags: ["arrays", "hashing"],
    statement: "Count the pairs of positions i < j whose values add up to the target.",
    input: "Line 1: n. Line 2: n integers. Line 3: the target.",
    output: "The number of pairs.",
    constraints: "1 ≤ n ≤ 10^5, −10^9 ≤ values, target ≤ 10^9",
    samples: [{ input: "5\n1 5 7 -1 5\n6\n", output: "3\n", note: "(1,5), (1,5) and (7,−1)." }],
    tests: [
      { input: "4\n1 1 1 1\n2\n", output: "6\n" },
      { input: "3\n1 2 3\n10\n", output: "0\n" },
      { input: "1\n5\n10\n", output: "0\n" },
      { input: "6\n2 2 4 4 0 6\n6\n", output: "5\n" },
    ],
  },
  {
    id: "matrix-row-col-max",
    title: "Largest row sum plus largest column sum",
    difficulty: "Easy",
    tier: "genc",
    tags: ["matrix"],
    statement: "Print the sum of the largest row total and the largest column total of the matrix.",
    input: "The first line has N and M. Then N lines of M integers.",
    output: "One integer.",
    constraints: "1 ≤ N, M ≤ 300, −10^4 ≤ values ≤ 10^4",
    samples: [{ input: "2 2\n1 2\n3 4\n", output: "13\n", note: "Row sums 3 and 7, column sums 4 and 6: 7 + 6 = 13." }],
    tests: [
      { input: "1 1\n5\n", output: "10\n" },
      { input: "2 3\n1 1 1\n2 2 2\n", output: "9\n" },
      { input: "3 1\n1\n2\n3\n", output: "9\n" },
      { input: "2 2\n-1 -2\n-3 -4\n", output: "-7\n" },
    ],
  },
  // ── SQL (Cognizant GenC technical round: two query questions on a given schema). Each test is a dataset script. ──
  {
    id: "sql-dept-headcount",
    title: "Employees per department",
    difficulty: "Easy",
    tier: "sql",
    tags: ["sql", "left join", "group by"],
    statement: "Tables: departments(id, name) and employees(id, name, dept_id, salary). For every department print its name and the number of employees in it, including departments with no employees (count 0). Order by department name.",
    input: "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    output: "One row per department: name|count. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    constraints: "At most 1000 rows per table.",
    samples: [{ input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\nINSERT INTO employees VALUES (1, 'Asha', 1, 50000), (2, 'Ravi', 2, 70000), (3, 'Meena', 2, 60000), (4, 'Karan', 2, 80000);\n", output: "HR|1\nIT|3\nSales|0\n" }],
    tests: [
      { input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'Ops');\n", output: "Ops|0\n" },
      { input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'B'), (2, 'A');\nINSERT INTO employees VALUES (1, 'x', 2, 1), (2, 'y', 2, 2), (3, 'z', 2, 3);\n", output: "A|3\nB|0\n" },
      { input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\nINSERT INTO employees VALUES (1, 'Asha', 3, 10), (2, 'Ravi', 1, 20);\n", output: "HR|1\nIT|0\nSales|1\n" },
    ],
  },
  {
    id: "sql-above-dept-avg",
    title: "Paid above the department average",
    difficulty: "Medium",
    tier: "sql",
    tags: ["sql", "join", "subquery"],
    statement: "Tables: departments(id, name) and employees(id, name, dept_id, salary). Print the employees whose salary is strictly greater than the average salary of their own department: name, department name and salary. Order by salary descending, then by employee name.",
    input: "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    output: "One row per employee: name|department|salary. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    constraints: "At most 1000 rows per table.",
    samples: [{ input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\nINSERT INTO employees VALUES (1, 'Asha', 1, 50000), (2, 'Ravi', 2, 70000), (3, 'Meena', 2, 60000), (4, 'Karan', 2, 80000);\n", output: "Karan|IT|80000\n" }],
    tests: [
      { input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\nINSERT INTO employees VALUES (1, 'A', 1, 100), (2, 'B', 1, 100);\n", output: "\n" },
      { input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\nINSERT INTO employees VALUES (1, 'Zed', 1, 10), (2, 'Amy', 1, 30), (3, 'Bob', 2, 30), (4, 'Cal', 2, 10), (5, 'Dan', 3, 5);\n", output: "Amy|HR|30\nBob|IT|30\n" },
      { input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\nINSERT INTO employees VALUES (1, 'Solo', 2, 1);\n", output: "\n" },
    ],
  },
  {
    id: "sql-customers-no-orders",
    title: "Customers without orders",
    difficulty: "Easy",
    tier: "sql",
    tags: ["sql", "left join", "not exists"],
    statement: "Tables: customers(id, name) and orders(id, customer_id, amount). Print the names of customers who have never placed an order, in alphabetical order.",
    input: "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    output: "One name per row. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    constraints: "At most 1000 rows per table.",
    samples: [{ input: "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount INTEGER);\nINSERT INTO customers VALUES (1, 'Priya'), (2, 'Rahul'), (3, 'Neha');\nINSERT INTO orders VALUES (1, 1, 500), (2, 1, 250);\n", output: "Neha\nRahul\n" }],
    tests: [
      { input: "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount INTEGER);\nINSERT INTO customers VALUES (1, 'A'), (2, 'B');\n", output: "A\nB\n" },
      { input: "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount INTEGER);\nINSERT INTO customers VALUES (1, 'A'), (2, 'B');\nINSERT INTO orders VALUES (1, 1, 1), (2, 2, 1);\n", output: "\n" },
      { input: "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount INTEGER);\nINSERT INTO customers VALUES (1, 'Zara'), (2, 'Mia'), (3, 'Ivy'), (4, 'Bea');\nINSERT INTO orders VALUES (1, 2, 9), (2, 2, 9), (3, 4, 1);\n", output: "Ivy\nZara\n" },
    ],
  },
  {
    id: "sql-top-products",
    title: "Top three products by quantity sold",
    difficulty: "Medium",
    tier: "sql",
    tags: ["sql", "join", "group by", "limit"],
    statement: "Tables: products(id, name) and order_items(id, product_id, quantity). Print the three products with the largest total quantity sold: name and total. Order by total descending, then by name; print fewer rows if fewer products were sold.",
    input: "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    output: "At most three rows: name|total. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    constraints: "At most 1000 rows per table.",
    samples: [{ input: "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE order_items (id INTEGER PRIMARY KEY, product_id INTEGER, quantity INTEGER);\nINSERT INTO products VALUES (1, 'Pen'), (2, 'Book'), (3, 'Bag'), (4, 'Ink');\nINSERT INTO order_items VALUES (1, 1, 10), (2, 2, 5), (3, 1, 7), (4, 3, 12), (5, 4, 17), (6, 2, 1);\n", output: "Ink|17\nPen|17\nBag|12\n" }],
    tests: [
      { input: "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE order_items (id INTEGER PRIMARY KEY, product_id INTEGER, quantity INTEGER);\nINSERT INTO products VALUES (1, 'Only');\nINSERT INTO order_items VALUES (1, 1, 3);\n", output: "Only|3\n" },
      { input: "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE order_items (id INTEGER PRIMARY KEY, product_id INTEGER, quantity INTEGER);\nINSERT INTO products VALUES (1, 'A'), (2, 'B'), (3, 'C');\nINSERT INTO order_items VALUES (1, 1, 5), (2, 2, 5), (3, 3, 5);\n", output: "A|5\nB|5\nC|5\n" },
      { input: "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE order_items (id INTEGER PRIMARY KEY, product_id INTEGER, quantity INTEGER);\nINSERT INTO products VALUES (1, 'Unsold'), (2, 'Sold');\nINSERT INTO order_items VALUES (1, 2, 2);\n", output: "Sold|2\n" },
    ],
  },
  {
    id: "sql-manager-name",
    title: "Employee with manager",
    difficulty: "Medium",
    tier: "sql",
    tags: ["sql", "self join"],
    statement: "Table: employees(id, name, manager_id), where manager_id refers to another employee's id and is NULL for the top manager. Print each employee's name with their manager's name; print NONE when there is no manager. Order by employee name.",
    input: "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    output: "One row per employee: employee|manager. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    constraints: "At most 1000 rows per table.",
    samples: [{ input: "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);\nINSERT INTO employees VALUES (1, 'Sita', NULL), (2, 'Arjun', 1), (3, 'Bala', 1), (4, 'Chitra', 2);\n", output: "Arjun|Sita\nBala|Sita\nChitra|Arjun\nSita|NONE\n" }],
    tests: [
      { input: "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);\nINSERT INTO employees VALUES (1, 'Boss', NULL);\n", output: "Boss|NONE\n" },
      { input: "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);\nINSERT INTO employees VALUES (1, 'A', 2), (2, 'B', 3), (3, 'C', NULL);\n", output: "A|B\nB|C\nC|NONE\n" },
      { input: "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);\nINSERT INTO employees VALUES (5, 'Zed', 9), (9, 'Yan', NULL), (7, 'Xia', 9);\n", output: "Xia|Yan\nYan|NONE\nZed|Yan\n" },
    ],
  },
  {
    id: "sql-second-highest",
    title: "Second highest salary",
    difficulty: "Easy",
    tier: "sql",
    tags: ["sql", "distinct", "limit"],
    statement: "Tables: departments(id, name) and employees(id, name, dept_id, salary). Print the second highest distinct salary among all employees. If there is no such salary, print nothing.",
    input: "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    output: "One row with the salary, or no rows. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    constraints: "At most 1000 rows per table.",
    samples: [{ input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\nINSERT INTO employees VALUES (1, 'Asha', 1, 50000), (2, 'Ravi', 2, 70000), (3, 'Meena', 2, 60000), (4, 'Karan', 2, 80000);\n", output: "70000\n" }],
    tests: [
      { input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\nINSERT INTO employees VALUES (1, 'A', 1, 100), (2, 'B', 1, 100);\n", output: "\n" },
      { input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\nINSERT INTO employees VALUES (1, 'A', 1, 100), (2, 'B', 1, 100), (3, 'C', 2, 90), (4, 'D', 2, 90);\n", output: "90\n" },
      { input: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER);\nINSERT INTO departments VALUES (1, 'HR'), (2, 'IT'), (3, 'Sales');\n", output: "\n" },
    ],
  },
];

/** Placement-style problems first, then the personal DSA track (lib/code/dsa.ts). */
export const PROBLEMS: Problem[] = [...PLACEMENT_PROBLEMS, ...DSA_PROBLEMS];

export type RunStatus = "ok" | "compile_error" | "runtime_error" | "timeout" | "output_limit";
const STATUS: Record<RunStatus, string> = { ok: "Accepted", compile_error: "Compile Error", runtime_error: "Runtime Error", timeout: "Time Limit Exceeded", output_limit: "Output Limit Exceeded" };
/**
 * LeetCode-style verdict for one run. Without an expected output (a custom input) a clean run is only
 * "Finished": nothing was checked, so it must never read as "Accepted".
 */
export const verdict = (r: { status: RunStatus; stdout: string }, expected?: string) =>
  r.status !== "ok" ? STATUS[r.status] : expected === undefined ? "Finished" : normalizeOutput(r.stdout) === normalizeOutput(expected) ? "Accepted" : "Wrong Answer";
/** A verdict that is not a failure (green or neutral, never red). */
export const isClean = (label: string) => label === "Accepted" || label === "Finished";
/** Editor file name per language. */
export const SOURCE_FILE: Record<Language, string> = { cpp: "main.cpp", java: "Main.java", python: "main.py", sql: "query.sql" };

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
