/** Numerical puzzles (grid-based), the style reported for the Infosys "Numerical Puzzle" section. */
import { mcq, rng } from "./rng";
import type { Question, Topic } from "./types";

/** Rules a student is likely to try on a row puzzle; none may fit unless it gives the same answer. */
const OBVIOUS_RULES: ((a: number, b: number) => number)[] = [
  (a, b) => a + b, (a, b) => a - b, (a, b) => a * b, (a, b) => a + b + 1, (a, b) => a + b - 1,
  (a, b) => a * b + 1, (a, b) => a * b - 1, (a, b) => 2 * a + b, (a, b) => a + 2 * b, (a, b) => 2 * (a - b),
  (a, b) => a * a, (a, b) => a * a - b, (a, b) => a * a + b * b, (a, b) => (a + b) ** 2, (a, b) => (a - b) ** 2,
  (a, b) => a * b - b, (a, b) => a * b + a, (a, b) => a * (a - b), (a, b) => b * b + a, (a, b) => a * a - b * b - 1,
];

function rowRule(seed: number): Question {
  const r = rng(seed);
  const rules: [string, (a: number, b: number) => number, string][] = [
    ["a × b − a", (a, b) => a * b - a, "third = first × second − first"],
    ["a² + b", (a, b) => a * a + b, "third = (first)² + second"],
    ["(a + b) × 2", (a, b) => (a + b) * 2, "third = (first + second) × 2"],
    ["a × b + b", (a, b) => a * b + b, "third = first × second + second"],
    ["a² − b²", (a, b) => a * a - b * b, "third = (first)² − (second)²"],
    ["(a − b) × (a + b) + 1", (a, b) => (a - b) * (a + b) + 1, "third = first² − second² + 1"],
  ];
  const [, f, text] = r.pick(rules);
  const rows: number[][] = [];
  while (rows.length < 3) {
    const a = r.int(3, 9);
    const b = r.int(2, a - 1);
    if (!rows.some((row) => row[0] === a && row[1] === b)) rows.push([a, b, f(a, b)]);
  }
  // Reject grids where another rule also explains the two visible rows but gives a different
  // answer: the puzzle must have one defensible answer. Checked against the puzzle rules and the
  // simple rules students try first (a² − b² equals a + b whenever b = a − 1, for example).
  const ambiguous = [...rules.map(([, g]) => g), ...OBVIOUS_RULES].some(
    (g) => g !== f && g(rows[0][0], rows[0][1]) === rows[0][2] && g(rows[1][0], rows[1][1]) === rows[1][2] && g(rows[2][0], rows[2][1]) !== rows[2][2],
  );
  if (ambiguous) return rowRule(seed + 7919);
  const ans = rows[2][2];
  const grid: (number | null)[][] = rows.map((row, i) => (i === 2 ? [row[0], row[1], null] : row));
  const [a, b] = rows[2];
  return mcq(r, {
    prompt: "Each row follows the same rule. Find the missing number.",
    grid,
    correct: `${ans}`,
    distractors: [`${a * b}`, `${a + b}`, `${ans + 2}`, `${ans - 3}`, `${a * a}`],
    explanation: `Rule: ${text}. Check row 1: ${rows[0][0]}, ${rows[0][1]} → ${rows[0][2]}. Row 3: ${a}, ${b} → ${ans}.`,
  });
}

/** 3×3 magic square built from the Lo Shu square: scaled, shifted, rotated and maybe mirrored. */
function magicSquare(seed: number): Question {
  const r = rng(seed);
  let sq = [
    [2, 7, 6],
    [9, 5, 1],
    [4, 3, 8],
  ];
  const k = r.int(1, 4);
  const c = r.int(0, 10);
  sq = sq.map((row) => row.map((v) => v * k + c));
  for (let t = r.int(0, 3); t > 0; t--) sq = sq[0].map((_, i) => sq.map((row) => row[i]).reverse());
  if (r.next() < 0.5) sq = sq.map((row) => [...row].reverse());
  const magic = sq[0][0] + sq[0][1] + sq[0][2];
  // Hide 3 non-centre cells, labelled A, B, C. Any 3 such cells are always solvable: the centre
  // gives the magic sum (3 × centre), and at least one hidden cell is alone in its row or column.
  const hidden = r.shuffle([0, 1, 2, 3, 5, 6, 7, 8]).slice(0, 3);
  const labels = ["A", "B", "C"];
  const grid: (number | string | null)[][] = sq.map((row, i) =>
    row.map((v, j) => {
      const h = hidden.indexOf(i * 3 + j);
      return h >= 0 ? labels[h] : v;
    }),
  );
  const vals = hidden.map((h) => sq[Math.floor(h / 3)][h % 3]);
  const askSum = r.next() < 0.5;
  const ans = askSum ? vals[0] + vals[1] + vals[2] : vals[1];
  return mcq(r, {
    prompt: `In this magic square every row, column and diagonal has the same sum. ${askSum ? "What is A + B + C?" : "What is the value of B?"}`,
    grid,
    correct: `${ans}`,
    distractors: [`${ans + k}`, `${ans - k}`, `${magic}`, `${ans + 2 * k}`, `${ans + 1}`],
    explanation: `The magic sum is ${magic} (centre ${sq[1][1]} × 3). Use any complete row/column to fill each letter: A = ${vals[0]}, B = ${vals[1]}, C = ${vals[2]}.`,
  });
}

/** Number pyramid: each cell is the sum of the two cells directly below it. */
function pyramid(seed: number): Question {
  const r = rng(seed);
  const base = Array.from({ length: 4 }, () => r.int(1, 12));
  const levels = [base];
  while (levels[0].length > 1) {
    const below = levels[0];
    levels.unshift(below.slice(1).map((v, i) => below[i] + v));
  }
  const top = levels[0][0];
  const hideIdx = r.int(0, 3);
  const last = levels.length - 1;
  const shown: (number | string | null)[][] = levels.map((row, i) =>
    i === 0 ? row : i === last ? row.map((v, j) => (j === hideIdx ? null : v)) : row.map(() => "·"),
  );
  const coeff = [1, 3, 3, 1][hideIdx];
  return mcq(r, {
    prompt: "In this number pyramid, each number is the sum of the two numbers directly below it. The top is given. Find the missing number in the bottom row (?).",
    grid: shown,
    correct: `${base[hideIdx]}`,
    distractors: [`${base[hideIdx] + 1}`, `${base[hideIdx] + 3}`, `${Math.max(0, base[hideIdx] - 2)}`, `${base[hideIdx] * 2}`],
    explanation: `The top of a 4-level pyramid = b1 + 3·b2 + 3·b3 + b4. Here ${top} = ${base.map((b, i) => (i === hideIdx ? `${[1, 3, 3, 1][i]}·?` : `${[1, 3, 3, 1][i]}·${b}`)).join(" + ")}, so ? = ${base[hideIdx]} (coefficient ${coeff}).`,
  });
}

/** Simple "find the value of each symbol" puzzle with equations. */
function symbolEquations(seed: number): Question {
  const r = rng(seed);
  const x = r.int(2, 9);
  const y = r.int(2, 9);
  const z = r.int(1, 9);
  const prompt = `Each symbol stands for a whole number.\n★ + ★ = ${2 * x}\n★ × ◆ = ${x * y}\n◆ + ● = ${y + z}\nWhat is ★ + ◆ × ●?`;
  const ans = x + y * z;
  return mcq(r, {
    prompt,
    correct: `${ans}`,
    distractors: [`${(x + y) * z}`, `${x + y + z}`, `${ans + 1}`, `${x * y * z}`],
    explanation: `★ = ${x}, ◆ = ${y}, ● = ${z}. Multiplication first: ${x} + ${y} × ${z} = ${ans} (not (${x}+${y})×${z}).`,
  });
}

// No I, O, L, Z, S: they look like digits.
const CRYPT_LETTERS = "ABCDEFGHKMNPRTUWXY".split("");

/** Every assignment of distinct digits (no leading zero) that makes a + b = c true. */
export function solveAddition(words: [string, string, string], fixed: Record<string, number> = {}) {
  const [a, b, c] = words;
  const cols = c.length;
  // Letters ordered by rightmost column, so each column is checked as soon as its letters are set.
  const order: string[] = [];
  const doneAt: number[] = [];
  for (let i = 0; i < cols; i++) {
    for (const w of words) {
      const ch = w[w.length - 1 - i];
      if (ch && !order.includes(ch)) order.push(ch);
    }
    doneAt[i] = order.length;
  }
  const leading = new Set(words.map((w) => w[0]));
  const val: Record<string, number> = {};
  const used = new Set<number>();
  const tail = (w: string, k: number) => [...w.slice(-k)].reduce((n, ch) => n * 10 + val[ch], 0);
  const out: Record<string, number>[] = [];
  const go = (idx: number) => {
    for (let i = 0; i < cols; i++) {
      if (doneAt[i] !== idx) continue;
      const m = 10 ** (i + 1);
      if ((tail(a, i + 1) + tail(b, i + 1)) % m !== tail(c, i + 1) % m) return;
    }
    if (idx === order.length) {
      if (tail(a, a.length) + tail(b, b.length) === tail(c, c.length)) out.push({ ...val });
      return;
    }
    const ch = order[idx];
    for (let d = 0; d <= 9; d++) {
      if ((ch in fixed && fixed[ch] !== d) || used.has(d) || (d === 0 && leading.has(ch))) continue;
      val[ch] = d;
      used.add(d);
      go(idx + 1);
      used.delete(d);
      delete val[ch];
    }
  };
  go(0);
  return out;
}

/** Letter-sum (cryptarithmetic) puzzles like SEND + MORE = MONEY, a frequently reported Infosys topic. */
function cryptarithm(seed: number): Question {
  const r = rng(seed);
  const a = r.int(100, 999);
  const b = r.int(100, 999);
  const sum = a + b;
  const digits = [...new Set(`${a}${b}${sum}`)];
  const letters = r.shuffle(CRYPT_LETTERS).slice(0, digits.length);
  const letterOf = Object.fromEntries(digits.map((d, i) => [d, letters[i]]));
  const word = (n: number) => [...`${n}`].map((d) => letterOf[d]).join("");
  const words: [string, string, string] = [word(a), word(b), word(sum)];
  const truth: Record<string, number> = Object.fromEntries(digits.map((d) => [letterOf[d], Number(d)]));
  const target = r.pick(letters);

  // Reveal other letters until the asked letter has exactly one possible value. Some letters can
  // never be pinned down (a column like G + 0 = G), and more than 3 hints is plain arithmetic:
  // both cases try another sum.
  const given: Record<string, number> = {};
  const hidden = r.shuffle(letters.filter((l) => l !== target));
  while (new Set(solveAddition(words, given).map((s) => s[target])).size > 1) {
    if (hidden.length === 0 || Object.keys(given).length === 3) return cryptarithm(seed + 7919);
    const l = hidden.pop()!;
    given[l] = truth[l];
  }

  const w = words[2].length + 2;
  const code = [`  ${words[0]}`.padStart(w), `+ ${words[1]}`.padStart(w), "-".repeat(w), words[2].padStart(w)].join("\n");
  const hints = Object.entries(given).map(([l, d]) => `${l} = ${d}`);
  const ans = truth[target];
  const taken = new Set([ans, ...Object.values(given)]);
  const carry = words[2].length > words[0].length ? `The sum has one more digit than the numbers being added, so its first letter is the carry: ${words[2][0]} = 1. ` : "";
  return mcq(r, {
    prompt: `Each letter stands for a different digit (0–9), and no number starts with 0.${hints.length ? ` Given: ${hints.join(", ")}.` : ""}\nWhat is the value of ${target}?`,
    code,
    correct: `${ans}`,
    // Only digits not already used by a hint, so options can't be ruled out without solving.
    distractors: r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !taken.has(d))).map(String),
    explanation: `${carry}Work column by column from the right, carrying 1 whenever a column adds up to 10 or more. One assignment that fits is ${letters.map((l) => `${l} = ${truth[l]}`).join(", ")}, i.e. ${a} + ${b} = ${sum}, and every assignment that fits gives ${target} = ${ans}.`,
  });
}

export const puzzleTopics: Topic[] = [
  // weight 3 = "FREQUENT" badge: cryptarithmetic shows up often in Infosys puzzle questions.
  { id: "z-crypt", section: "puzzle", label: "Cryptarithmetic", weight: 3, targetSec: 180, generate: cryptarithm },
  { id: "z-rowrule", section: "puzzle", label: "Grid Row Rules", weight: 3, targetSec: 150, generate: rowRule },
  { id: "z-magic", section: "puzzle", label: "Magic Squares", weight: 2, targetSec: 150, generate: magicSquare },
  { id: "z-pyramid", section: "puzzle", label: "Number Pyramids", weight: 2, targetSec: 150, generate: pyramid },
  { id: "z-symbols", section: "puzzle", label: "Symbol Equations", weight: 1, targetSec: 120, generate: symbolEquations },
];
