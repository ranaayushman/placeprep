import type { Field, FnSpec, Returns } from "./harness";

/**
 * Function signatures for LeetCode-style practice (/code and the DSA track), keyed by problem id.
 * `read` must follow the problem's stdin layout exactly; tests/fn-harness.test.ts proves each spec against
 * the hidden tests. Types follow the constraints: int where values fit 32 bits, long where sums can overflow.
 * A problem without a spec stays a full program.
 */
const n: Field = { name: "n", type: "int" };
const arr = (name: string, type: "int[]" | "long[]" = "int[]", len = "n"): Field => ({ name, type, len });
const yesNo: Returns = { type: "bool", yes: "YES", no: "NO" };
const spec = (name: string, read: Field[], args: string[], returns: Returns): FnSpec => ({ name, read, args, returns });

export const FN_SPECS: Record<string, FnSpec> = {
  "move-zeros": spec("moveZeros", [n, arr("nums")], ["nums"], { type: "int[]" }),
  "toggle-bits": spec("toggleBits", [{ name: "n", type: "long" }], ["n"], { type: "long" }),
  "count-near": spec("countNear", [n, arr("nums"), { name: "num", type: "long" }, { name: "diff", type: "long" }], ["nums", "num", "diff"], { type: "int" }),
  "difference-of-sums": spec("differenceOfSums", [{ name: "n", type: "long" }, { name: "m", type: "long" }], ["n", "m"], { type: "long" }),
  "sort-012": spec("sortColors", [n, arr("nums")], ["nums"], { type: "int[]" }),
  "reverse-words": spec("reverseWords", [{ name: "s", type: "line" }], ["s"], { type: "string" }),
  "second-largest": spec("secondLargest", [n, arr("nums")], ["nums"], { type: "long" }),
  palindrome: spec("isPalindrome", [{ name: "s", type: "line" }], ["s"], yesNo),
  "max-subarray": spec("maxSubarraySum", [n, arr("nums")], ["nums"], { type: "long" }),
  "balanced-brackets": spec("isBalanced", [{ name: "s", type: "string" }], ["s"], yesNo),
  "perfect-number": spec("isPerfect", [{ name: "n", type: "long" }], ["n"], { type: "bool", yes: "Perfect", no: "Not Perfect" }),
  "sum-of-two-primes": spec("twoPrimes", [n], ["n"], { type: "string" }),
  "class-monitor": spec("monitorChanges", [n, arr("ranks")], ["ranks"], { type: "int" }),
  "string-alternation": spec("mergeAlternately", [{ name: "a", type: "string" }, { name: "b", type: "string" }], ["a", "b"], { type: "string" }),
  "k-set-bits": spec("countWithKSetBits", [n, { name: "k", type: "int" }], ["n", "k"], { type: "long" }),
  "odd-sum-subarrays": spec("countOddSumSubarrays", [n, arr("nums")], ["nums"], { type: "long" }),
  "longest-palindrome": spec("longestPalindrome", [{ name: "s", type: "string" }], ["s"], { type: "int" }),
  "kth-largest": spec("kthLargest", [n, { name: "k", type: "int" }, arr("nums")], ["nums", "k"], { type: "long" }),
  "count-inversions": spec("countInversions", [n, arr("nums")], ["nums"], { type: "long" }),
  "char-frequency": spec("charFrequency", [{ name: "s", type: "string" }], ["s"], { type: "lines" }),
  "string-match": spec("countOccurrences", [{ name: "text", type: "string" }, { name: "pattern", type: "string" }], ["text", "pattern"], { type: "int" }),
  "first-non-repeating": spec("firstUnique", [{ name: "s", type: "string" }], ["s"], { type: "string" }),
  "missing-number": spec("missingNumber", [n, arr("nums", "int[]", "n-1")], ["n", "nums"], { type: "int" }),
  "merge-sorted": spec("mergeSorted", [n, arr("a"), { name: "m", type: "int" }, arr("b", "int[]", "m")], ["a", "b"], { type: "int[]" }),
  "symmetric-matrix": spec("isSymmetric", [n, { name: "matrix", type: "int[][]", rows: "n", cols: "n" }], ["matrix"], yesNo),
  "pairs-target-sum": spec("countPairs", [n, arr("nums"), { name: "target", type: "long" }], ["nums", "target"], { type: "long" }),
  "matrix-row-col-max": spec("rowColMax", [n, { name: "m", type: "int" }, { name: "grid", type: "int[][]", rows: "n", cols: "m" }], ["grid"], { type: "long" }),
  "genc-festival-switch": spec("festivalMode", [{ name: "b", type: "int" }, { name: "value", type: "long" }], ["b", "value"], { type: "long" }),
  "genc-locker-splits": spec("countSplits", [{ name: "code", type: "string" }, { name: "k", type: "int" }], ["code", "k"], { type: "long" }),
  "genc-heavy-left": spec("heavyLeftCuts", [n, arr("nums", "long[]")], ["nums"], { type: "int" }),
  "genc-vowel-gap": spec("vowelGap", [{ name: "s", type: "string" }], ["s"], { type: "int" }),
  "genc-running-echo": spec("runningEcho", [{ name: "s", type: "string" }], ["s"], { type: "string" }),
  "genc-ascii-gap": spec("gapPair", [{ name: "s", type: "string" }, { name: "k", type: "int" }], ["s", "k"], { type: "string" }),
  "genc-unique-min-grid": spec("smallestOneOff", [n, { name: "grid", type: "int[][]", rows: "n", cols: "n" }], ["grid"], { type: "int" }),
  "genc-step-sequence": spec("stepSequence", [n, arr("first", "long[]", "4")], ["n", "first"], { type: "long[]" }),
  "dsa-min-max": spec("minMax", [n, arr("temps")], ["temps"], { type: "int[]" }),
  "dsa-reverse-array": spec("reverseArray", [n, arr("nums")], ["nums"], { type: "int[]" }),
  "dsa-is-sorted": spec("isSorted", [n, arr("nums")], ["nums"], yesNo),
  "dsa-max-consecutive-ones": spec("maxConsecutiveOnes", [n, arr("nums")], ["nums"], { type: "int" }),
  "dsa-remove-duplicates-sorted": spec("removeDuplicates", [n, arr("nums")], ["nums"], { type: "countAndList" }),
  "dsa-rotate-right": spec("rotateRight", [n, { name: "k", type: "long" }, arr("nums")], ["nums", "k"], { type: "int[]" }),
};
