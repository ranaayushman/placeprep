/**
 * Cognizant GenC game-based aptitude (reported: 4 games picked from a larger set, 50 min, adaptive,
 * no negative marking). The real round is interactive; these are the multiple-choice forms of the four
 * games whose prompts translate to a single answer: Geo-Sudo, Switch, Digit and Motion challenges.
 * Every answer is computed (sudoku completions, permutations, BFS), never hand-written.
 * shortcut: no Grid (memory) or Inductive (figure) challenge, add them when the runner can show timed
 * interactive screens or figures.
 */
import { mcq, rng, type Rng } from "./rng";
import type { Question, Topic } from "./types";

const SHAPES = ["●", "▲", "■", "★", "◆"];

/** Number of ways to fill the blanks (null) so no symbol repeats in a row or column, stopping at `cap`. */
export function countLatin(g: (number | null)[][], cap = 2): number {
  const n = g.length;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (g[i][j] !== null) continue;
      let total = 0;
      for (let v = 0; v < n && total < cap; v++) {
        if (g[i].includes(v) || g.some((row) => row[j] === v)) continue;
        g[i][j] = v;
        total += countLatin(g, cap - total);
        g[i][j] = null;
      }
      return total;
    }
  return 1;
}

function geoSudo(seed: number, hard = false): Question {
  const r = rng(seed);
  const n = hard || r.next() < 0.4 ? 5 : 4;
  // Random Latin square: a cyclic one with rows, columns and symbols shuffled.
  const [rows, cols, syms] = [r.shuffle([...Array(n).keys()]), r.shuffle([...Array(n).keys()]), r.shuffle([...Array(n).keys()])];
  const full = rows.map((i) => cols.map((j) => syms[(i + j) % n]));
  // Blank cells one by one while the completion stays unique, up to the target count.
  const g: (number | null)[][] = full.map((row) => [...row]);
  const target = n === 4 ? r.int(8, 10) : hard ? r.int(16, 18) : r.int(13, 15);
  let blanks = 0;
  for (const k of r.shuffle([...Array(n * n).keys()])) {
    if (blanks === target) break;
    const [i, j] = [Math.floor(k / n), k % n];
    g[i][j] = null;
    if (countLatin(g) === 1) blanks++;
    else g[i][j] = full[i][j];
  }
  // Ask about a blank that its own row and column alone do not give away.
  const empty = [...Array(n * n).keys()].filter((k) => g[Math.floor(k / n)][k % n] === null);
  const seen = (k: number) => new Set([...g[Math.floor(k / n)], ...g.map((row) => row[k % n])].filter((v) => v !== null)).size;
  const ask = empty.find((k) => seen(k) < n - 1) ?? empty[0];
  const [ai, aj] = [Math.floor(ask / n), ask % n];
  const answer = SHAPES[full[ai][aj]];
  return mcq(r, {
    prompt: `Geo-Sudo: fill the ${n}×${n} grid so that every row and every column has each of the ${n} shapes exactly once. Which shape goes in the "?" cell?`,
    grid: g.map((row, i) => row.map((v, j) => (i === ai && j === aj ? null : v === null ? "" : SHAPES[v]))),
    correct: answer,
    distractors: r.shuffle(SHAPES.slice(0, n).filter((s) => s !== answer)),
    explanation: `The grid has one completion:\n${full.map((row) => row.map((v) => SHAPES[v]).join(" ")).join("\n")}\nRow ${ai + 1}, column ${aj + 1} is ${answer}.`,
  });
}

/** Output position k takes input item code[k] (1-based digits). */
const applyCode = <T>(items: T[], code: number[]) => code.map((c) => items[c - 1]);
const codeStr = (c: number[]) => c.join("");

function randomCode(r: Rng) {
  return r.shuffle([1, 2, 3, 4]);
}

function switchChallenge(seed: number, hard = false): Question {
  const r = rng(seed);
  const input = r.shuffle(SHAPES).slice(0, 4);
  const two = hard || r.next() < 0.4; // harder form: a known switch first, find the second
  const first = randomCode(r);
  let ans = randomCode(r);
  while (codeStr(ans) === "1234") ans = randomCode(r);
  const mid = two ? applyCode(input, first) : input;
  const out = applyCode(mid, ans);
  const wrong: string[] = [];
  for (let i = 0; wrong.length < 6 && i < 200; i++) {
    const c = randomCode(r);
    if (applyCode(mid, c).join() !== out.join() && !wrong.includes(codeStr(c))) wrong.push(codeStr(c));
  }
  // Trap: the inverse permutation (reading the code the wrong way round).
  const inv = [0, 0, 0, 0];
  ans.forEach((c, k) => (inv[c - 1] = k + 1));
  if (codeStr(inv) !== codeStr(ans)) wrong.unshift(codeStr(inv));
  return mcq(r, {
    prompt: `Switch challenge: a switch's 4-digit code reorders the shapes passing through it. Code 3142 means the 1st output is the 3rd input, the 2nd output is the 1st input, and so on. ${two ? "The shapes pass through two switches. Which code is on the second switch?" : "Which code is on the switch?"}`,
    code: `Input   ${input.join(" ")}\n${two ? `        ↓ [${codeStr(first)}]\n        ${mid.join(" ")}\n` : ""}        ↓ [ ? ]\nOutput  ${out.join(" ")}`,
    correct: codeStr(ans),
    distractors: wrong,
    explanation: `${ans.map((c, k) => `output ${k + 1} (${out[k]}) is ${two ? "middle-row" : "input"} item ${c}`).join(", ")}, so the code is ${codeStr(ans)}.`,
  });
}

const DIGIT_TEMPLATES: [string, (a: number, b: number, c: number) => number | null][] = [
  ["□ + □ × □", (a, b, c) => a + b * c],
  ["□ × □ − □", (a, b, c) => a * b - c],
  ["(□ + □) × □", (a, b, c) => (a + b) * c],
  ["□ × □ + □", (a, b, c) => a * b + c],
  ["□ ÷ □ + □", (a, b, c) => (a % b === 0 ? a / b + c : null)],
  ["(□ − □) × □", (a, b, c) => (a - b) * c],
  ["□ × (□ − □)", (a, b, c) => a * (b - c)],
  ["□ + □ − □ × 2", (a, b, c) => a + b - c * 2],
];

function digitChallenge(seed: number, hard = false): Question {
  const r = rng(seed);
  const [shape, f] = r.pick(hard ? DIGIT_TEMPLATES.slice(4) : DIGIT_TEMPLATES.slice(0, 4));
  let t: number[];
  let rhs: number | null;
  do {
    t = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
    rhs = f(t[0], t[1], t[2]);
  } while (rhs === null || rhs <= 0);
  const fits = (x: number[]) => f(x[0], x[1], x[2]) === rhs;
  // Traps first: the same digits in another order, then nearby digits.
  const perms = [[0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => p.map((i) => t[i]));
  const near = [...Array(30)].map(() => t.map((d) => (r.next() < 0.5 ? d : Math.min(9, Math.max(1, d + r.pick([-1, 1]))))));
  const wrong = [...r.shuffle(perms), ...near].filter((x) => new Set(x).size === 3 && !fits(x)).map((x) => x.join(", "));
  return mcq(
    r,
    {
      prompt: "Digit challenge: fill the boxes from left to right with three different digits from 1 to 9 so that the equation is true. Which digits work?",
      code: `${shape} = ${rhs}`,
      correct: t.join(", "),
      distractors: wrong,
      explanation: `${shape.replace("□", `${t[0]}`).replace("□", `${t[1]}`).replace("□", `${t[2]}`)} = ${rhs}. Usual order of operations applies: brackets, then × and ÷, then + and −.`,
    },
    (i) => [i % 9 + 1, ((i * 4) % 9) + 1, ((i * 7) % 9) + 1].join(", "),
  );
}

const WALL = "■";
const BALL = "●";
const HOLE = "◎";

/** Fewest single steps (up/down/left/right, no walls) from the ball to the hole, with one shortest path. */
export function shortestPath(grid: string[][]): { steps: number; path: string } | null {
  const n = grid.length;
  const m = grid[0].length;
  const find = (s: string) => {
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) if (grid[i][j] === s) return [i, j];
    throw new Error(`no ${s}`);
  };
  const [si, sj] = find(BALL);
  const prev = new Map<number, [number, string]>([[si * m + sj, [-1, ""]]]);
  const queue = [[si, sj]];
  const moves: [number, number, string][] = [[-1, 0, "↑"], [1, 0, "↓"], [0, -1, "←"], [0, 1, "→"]];
  while (queue.length) {
    const [i, j] = queue.shift()!;
    if (grid[i][j] === HOLE) {
      let path = "";
      for (let k = i * m + j; prev.get(k)![0] !== -1; k = prev.get(k)![0]) path = prev.get(k)![1] + path;
      return { steps: path.length, path };
    }
    for (const [di, dj, d] of moves) {
      const [a, b] = [i + di, j + dj];
      if (a < 0 || b < 0 || a >= n || b >= m || grid[a][b] === WALL || prev.has(a * m + b)) continue;
      prev.set(a * m + b, [i * m + j, d]);
      queue.push([a, b]);
    }
  }
  return null;
}

function motionChallenge(seed: number, hard = false): Question {
  const r = rng(seed);
  for (;;) {
    const n = hard ? 7 : r.int(5, 6);
    const grid: string[][] = [...Array(n)].map(() => [...Array(n)].map(() => (r.next() < 0.3 ? WALL : "")));
    const cells = r.shuffle([...Array(n * n).keys()]);
    const [b, h] = [cells[0], cells[1]];
    grid[Math.floor(b / n)][b % n] = BALL;
    grid[Math.floor(h / n)][h % n] = HOLE;
    const best = shortestPath(grid);
    const straight = Math.abs(Math.floor(b / n) - Math.floor(h / n)) + Math.abs((b % n) - (h % n));
    // Keep mazes where walls force a detour, so counting the straight distance is a trap, not the answer.
    if (!best || best.steps < straight + (hard ? 6 : 2) || best.steps > (hard ? 20 : 14)) continue;
    return mcq(r, {
      prompt: `Motion challenge: the ball (${BALL}) moves one cell at a time up, down, left or right and cannot pass through walls (${WALL}). What is the fewest number of moves to reach the hole (${HOLE})?`,
      grid,
      correct: `${best.steps}`,
      distractors: [`${straight}`, `${best.steps + 2}`, `${best.steps - 2}`, `${best.steps + 4}`].filter((d) => Number(d) > 0),
      explanation: `One shortest route: ${best.path.split("").join(" ")} (${best.steps} moves). Walls block the straight route of ${straight} moves.`,
    });
  }
}

export const gameTopics: Topic[] = [
  { id: "g-geosudo", section: "game", label: "Geo-Sudo (deductive)", weight: 1, targetSec: 120, generate: (s) => geoSudo(s), hard: (s) => geoSudo(s, true) },
  { id: "g-switch", section: "game", label: "Switch challenge", weight: 1, targetSec: 90, generate: (s) => switchChallenge(s), hard: (s) => switchChallenge(s, true) },
  { id: "g-digit", section: "game", label: "Digit challenge", weight: 1, targetSec: 90, generate: (s) => digitChallenge(s), hard: (s) => digitChallenge(s, true) },
  { id: "g-motion", section: "game", label: "Motion challenge", weight: 1, targetSec: 90, generate: (s) => motionChallenge(s), hard: (s) => motionChallenge(s, true) },
];
