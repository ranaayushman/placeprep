/** Numerical puzzles (grid-based), the style reported for the Infosys "Numerical Puzzle" section. */
import { mcq, rng } from "./rng";
import type { Question, Topic } from "./types";

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
  // Reject grids where a different rule from the list also explains the two visible rows
  // but gives another answer — the puzzle must have one defensible answer.
  const ambiguous = rules.some(
    ([, g]) => g !== f && g(rows[0][0], rows[0][1]) === rows[0][2] && g(rows[1][0], rows[1][1]) === rows[1][2] && g(rows[2][0], rows[2][1]) !== rows[2][2],
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

export const puzzleTopics: Topic[] = [
  { id: "z-rowrule", section: "puzzle", label: "Grid Row Rules", weight: 3, targetSec: 150, generate: rowRule },
  { id: "z-magic", section: "puzzle", label: "Magic Squares", weight: 2, targetSec: 150, generate: magicSquare },
  { id: "z-pyramid", section: "puzzle", label: "Number Pyramids", weight: 2, targetSec: 150, generate: pyramid },
  { id: "z-symbols", section: "puzzle", label: "Symbol Equations", weight: 1, targetSec: 120, generate: symbolEquations },
];
