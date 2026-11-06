/**
 * Pseudocode output questions in the Infosys style ("Integer a, b", "Set a = 5", "Print a").
 * Each template builds the code text AND computes the answer by running the same logic in JS,
 * so the printed answer is always right. Distractors come from common tracing mistakes
 * (off-by-one loop bounds, forgetting integer division, etc.).
 */
import { mcq, rng, type Rng } from "./rng";
import type { Question, Topic } from "./types";

type Built = { code: string; ans: number | string; alts: (number | string)[]; why: string };

function loopCondition(r: Rng): Built {
  const a0 = r.int(1, 9);
  const b0 = r.int(0, 9);
  const n = r.int(4, 8);
  const k = r.int(2, 4);
  const run = (limit: number) => {
    let a = a0;
    let b = b0;
    for (let i = 1; i <= limit; i++) {
      if ((i + a) % k === 0) b = b + i;
      else a = a + 1;
    }
    return a + b;
  };
  return {
    code: `Integer a, b, i
Set a = ${a0}, b = ${b0}
for (i = 1 to ${n})
    if ((i + a) mod ${k} == 0)
        b = b + i
    else
        a = a + 1
    end if
end for
Print a + b`,
    ans: run(n),
    alts: [run(n - 1), run(n + 1), run(n) + 1, run(n) - 2],
    why: `Trace each iteration, remembering that a changes inside the loop and affects the next condition check. Final a + b = ${run(n)}.`,
  };
}

function digits(r: Rng): Built {
  const num = r.int(1000, 98765);
  const kind = r.int(0, 2);
  const ds = String(num).split("").map(Number);
  if (kind === 0) {
    const rev = Number(String(num).split("").reverse().join(""));
    return {
      code: `Integer n, s
Set n = ${num}, s = 0
while (n > 0)
    s = s * 10 + (n mod 10)
    n = n / 10
end while
Print s`,
      ans: rev,
      alts: [num, ds.reduce((a, b) => a + b, 0), Math.floor(rev / 10), rev * 10],
      why: `Each step moves the last digit of n onto the end of s, and n / 10 is integer division. This reverses the number: ${rev}.`,
    };
  }
  if (kind === 1) {
    const sum = ds.reduce((a, b) => a + b, 0);
    return {
      code: `Integer n, s
Set n = ${num}, s = 0
while (n != 0)
    s = s + (n mod 10)
    n = n / 10
end while
Print s`,
      ans: sum,
      alts: [sum - ds[0], sum + 1, ds.length, sum - ds[ds.length - 1]],
      why: `n mod 10 extracts the last digit; the loop adds every digit: ${ds.join(" + ")} = ${sum}.`,
    };
  }
  const even = ds.filter((d) => d % 2 === 0).length;
  return {
    code: `Integer n, c, d
Set n = ${num}, c = 0
while (n > 0)
    d = n mod 10
    if (d mod 2 == 0)
        c = c + 1
    end if
    n = n / 10
end while
Print c`,
    ans: even,
    alts: [ds.length - even, ds.length, even + 1, Math.max(0, even - 1)],
    why: `The loop counts even digits of ${num} (0 counts as even): ${ds.filter((d) => d % 2 === 0).join(", ") || "none"} → ${even}.`,
  };
}

function recursion(r: Rng): Built {
  const kind = r.int(0, 2);
  if (kind === 0) {
    const base = r.int(1, 3);
    const n = r.int(5, 8);
    const f = (x: number): number => (x <= 1 ? base : f(x - 1) + f(x - 2));
    return {
      code: `Integer fun(Integer x)
    if (x <= 1)
        return ${base}
    end if
    return fun(x - 1) + fun(x - 2)
End function fun()

Print fun(${n})`,
      ans: f(n),
      alts: [f(n - 1), f(n + 1), f(n) + base, f(n) * 2],
      why: `fun(0) = fun(1) = ${base}, and each value is the sum of the previous two (Fibonacci-like). fun(${n}) = ${f(n)}.`,
    };
  }
  if (kind === 1) {
    const n = r.int(4, 7);
    const k = r.int(1, 3);
    const f = (x: number): number => (x === 0 ? 0 : x * k + f(x - 1));
    return {
      code: `Integer fun(Integer x)
    if (x == 0)
        return 0
    end if
    return x * ${k} + fun(x - 1)
End function fun()

Print fun(${n})`,
      ans: f(n),
      alts: [f(n - 1), f(n) + k, (n * (n - 1) * k) / 2, n * k],
      why: `fun(${n}) = ${k}·(${n} + ${n - 1} + … + 1) = ${k} × ${(n * (n + 1)) / 2} = ${f(n)}.`,
    };
  }
  const a = r.int(20, 99);
  const b = r.int(4, 18);
  const g = (x: number, y: number): number => (y === 0 ? x : g(y, x % y));
  return {
    code: `Integer fun(Integer p, Integer q)
    if (q == 0)
        return p
    end if
    return fun(q, p mod q)
End function fun()

Print fun(${a}, ${b})`,
    ans: g(a, b),
    alts: [a % b, (a * b) / g(a, b), g(a, b) + 1, b],
    why: `This is Euclid's algorithm: it returns the HCF of ${a} and ${b}, which is ${g(a, b)}.`,
  };
}

function bitwise(r: Rng): Built {
  const a = r.int(5, 30);
  const b = r.int(3, 25);
  const ops: [string, number, string][] = [
    ["a & b", a & b, "AND keeps bits set in both"],
    ["a | b", a | b, "OR keeps bits set in either"],
    ["a ^ b", a ^ b, "XOR keeps bits set in exactly one"],
    ["(a ^ b) + (a & b)", (a ^ b) + (a & b), "XOR plus AND equals OR"],
    ["a << 2", a << 2, "Left shift by 2 multiplies by 4"],
    ["(a | b) - (a & b)", (a | b) - (a & b), "OR minus AND equals XOR"],
  ];
  const [expr, ans, rule] = r.pick(ops);
  const bin = (n: number) => n.toString(2).padStart(5, "0");
  return {
    code: `Integer a, b, c
Set a = ${a}, b = ${b}
c = ${expr}
Print c`,
    ans,
    alts: [a & b, a | b, a ^ b, a + b, a << 1].filter((x) => x !== ans),
    why: `${rule}. a = ${bin(a)}₂, b = ${bin(b)}₂ → c = ${ans}.`,
  };
}

function nestedLoops(r: Rng): Built {
  const n = r.int(3, 6);
  const m = r.int(n, n + 3);
  const kind = r.int(0, 1);
  const count = (nn: number, mm: number) => {
    let c = 0;
    for (let i = 1; i <= nn; i++) for (let j = kind === 0 ? i : 1; j <= mm; j += kind === 0 ? 1 : i) c++;
    return c;
  };
  const inner = kind === 0 ? `for (j = i to ${m})` : `for (j = 1 to ${m}, step i)`;
  return {
    code: `Integer i, j, count
Set count = 0
for (i = 1 to ${n})
    ${inner}
        count = count + 1
    end for
end for
Print count`,
    ans: count(n, m),
    alts: [n * m, count(n, m) + 1, count(n - 1, m), count(n, m + 1)],
    why:
      kind === 0
        ? `For each i the inner loop runs (${m} − i + 1) times. Sum over i = 1..${n} gives ${count(n, m)}.`
        : `For each i the inner loop runs ⌈${m}/i⌉ times (j = 1, 1+i, 1+2i, …). Total = ${count(n, m)}.`,
  };
}

function arrays(r: Rng): Built {
  const arr = Array.from({ length: 6 }, () => r.int(1, 20));
  const kind = r.int(0, 2);
  if (kind === 0) {
    let x = 0;
    for (let i = 0; i < 6; i++) if (arr[i] % 2 === 1) x += arr[i];
    else x -= 1;
    return {
      code: `Integer arr[6] = {${arr.join(", ")}}
Integer i, x
Set x = 0
for (i = 0 to 5)
    if (arr[i] mod 2 == 1)
        x = x + arr[i]
    else
        x = x - 1
    end if
end for
Print x`,
      ans: x,
      alts: [arr.filter((v) => v % 2).reduce((a, b) => a + b, 0), x + 1, x - 2, arr.reduce((a, b) => a + b, 0)],
      why: `Odd elements are added, each even element subtracts 1. Result = ${x}.`,
    };
  }
  if (kind === 1) {
    let best = arr[0];
    let idx = 0;
    for (let i = 1; i < 6; i++) if (arr[i] >= best) { best = arr[i]; idx = i; }
    return {
      code: `Integer arr[6] = {${arr.join(", ")}}
Integer i, best, pos
Set best = arr[0], pos = 0
for (i = 1 to 5)
    if (arr[i] >= best)
        best = arr[i]
        pos = i
    end if
end for
Print pos`,
      ans: idx,
      alts: [arr.indexOf(Math.max(...arr)), idx + 1, best, 5, 0],
      why: `The loop finds the maximum; because of “>=”, ties move pos to the LATER index. Max = ${best} at index ${idx} (0-based).`,
    };
  }
  const k = r.int(1, 3);
  const out = [...arr];
  for (let i = 0; i < 6 - k; i++) out[i] = out[i + k];
  return {
    code: `Integer arr[6] = {${arr.join(", ")}}
Integer i
for (i = 0 to ${5 - k})
    arr[i] = arr[i + ${k}]
end for
Print arr[0] + arr[5]`,
    ans: out[0] + out[5],
    alts: [arr[0] + arr[5], arr[k] + arr[5 - k], out[0] + out[4], out[0]],
    why: `Elements shift left by ${k}; the last ${k} element(s) stay unchanged. arr[0] = ${out[0]}, arr[5] = ${out[5]} → ${out[0] + out[5]}.`,
  };
}

function callByValue(r: Rng): Built {
  const a = r.int(2, 15);
  const b = r.int(2, 15);
  return {
    code: `function change(Integer p, Integer q)
    p = p + q
    q = p - q
    p = p - q
End function change()

Integer a, b
Set a = ${a}, b = ${b}
change(a, b)
Print a, b`,
    ans: `${a} ${b}`,
    alts: [`${b} ${a}`, `${a + b} ${a}`, `${a + b} ${b}`, `${b} ${b}`],
    why: `Parameters are passed by value: change() swaps its own copies p and q, but a and b in the caller are untouched. Output: ${a} ${b}.`,
  };
}

function conditionals(r: Rng): Built {
  const x0 = r.int(10, 60);
  const y0 = r.int(2, 9);
  const run = () => {
    let x = x0;
    let y = y0;
    while (x > y) {
      if (x % y === 0) x = x / y;
      else x = x - y;
      y = y + 1;
    }
    return x + y;
  };
  const ans = run();
  return {
    code: `Integer x, y
Set x = ${x0}, y = ${y0}
while (x > y)
    if (x mod y == 0)
        x = x / y
    else
        x = x - y
    end if
    y = y + 1
end while
Print x + y`,
    ans,
    alts: [ans + 1, ans - 1, x0 + y0, ans + y0],
    why: `Trace carefully: y increases every pass, and x either divides or subtracts. The loop stops once x ≤ y. Result = ${ans}.`,
  };
}

const TEMPLATES = [loopCondition, digits, recursion, bitwise, nestedLoops, arrays, callByValue, conditionals];

function pseudocode(seed: number, template?: (r: Rng) => Built): Question {
  const r = rng(seed);
  const b = (template ?? TEMPLATES[seed % TEMPLATES.length])(r);
  return mcq(r, {
    prompt: "What will be the output of the following pseudocode?",
    code: b.code,
    correct: String(b.ans),
    distractors: b.alts.map(String),
    explanation: b.why,
  });
}

export const pseudocodeTopics: Topic[] = [
  { id: "p-loops", section: "pseudocode", label: "Loops & Conditions", weight: 3, targetSec: 120, generate: (s) => pseudocode(s, [loopCondition, nestedLoops, conditionals][s % 3]) },
  { id: "p-digits", section: "pseudocode", label: "Digit Manipulation", weight: 2, targetSec: 90, generate: (s) => pseudocode(s, digits) },
  { id: "p-recursion", section: "pseudocode", label: "Recursion", weight: 3, targetSec: 120, generate: (s) => pseudocode(s, recursion) },
  { id: "p-bitwise", section: "pseudocode", label: "Bitwise Operators", weight: 2, targetSec: 90, generate: (s) => pseudocode(s, bitwise) },
  { id: "p-arrays", section: "pseudocode", label: "Arrays", weight: 2, targetSec: 120, generate: (s) => pseudocode(s, arrays) },
  { id: "p-functions", section: "pseudocode", label: "Functions & Parameter Passing", weight: 1, targetSec: 90, generate: (s) => pseudocode(s, callByValue) },
];
