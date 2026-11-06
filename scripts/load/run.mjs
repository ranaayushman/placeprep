// Simulates every seeded student taking the reasoning section at the same time:
// load state, answer all 15 questions (one request each), submit the section, load the next one.
// Usage: node scripts/load/run.mjs http://localhost:3000        (everyone at once — a stress test)
//        PACE_MS=4000 node scripts/load/run.mjs http://localhost:3000  (paced — closer to a real exam)
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const students = JSON.parse(readFileSync(new URL("./sessions.json", import.meta.url)));
const lat = [];
let errors = 0;
const codes = {};

async function call(s, body) {
  const t = performance.now();
  const res = await fetch(`${base}/api/attempts/${s.attemptId}`, {
    method: body ? "POST" : "GET",
    headers: { cookie: `sid=${s.token}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  lat.push(performance.now() - t);
  codes[res.status] = (codes[res.status] ?? 0) + 1;
  if (!res.ok) errors++;
  return res.json();
}

// PACE_MS > 0 adds "thinking time" between answers (real candidates spend ~60 s per question).
const pace = Number(process.env.PACE_MS ?? 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function student(s) {
  if (pace) await sleep(Math.random() * pace);
  const st = await call(s);
  for (const q of st.current.questions) {
    if (pace) await sleep(pace / 2 + Math.random() * pace);
    await call(s, { action: "answer", questionId: q.id, chosenIndex: Math.floor(Math.random() * q.view.options.length), timeDeltaMs: 20000 });
  }
  await call(s, { action: "violation", type: "tab-hidden" });
  await call(s, { action: "submit-section", sectionOrder: 0 });
  const next = await call(s);
  if (next.current?.section !== "math") errors++;
}

const t0 = performance.now();
await Promise.all(students.map(student));
const total = (performance.now() - t0) / 1000;
lat.sort((a, b) => a - b);
const p = (q) => lat[Math.min(lat.length - 1, Math.floor(q * lat.length))].toFixed(0);
console.log(JSON.stringify({
  students: students.length, requests: lat.length, seconds: total.toFixed(1),
  reqPerSec: (lat.length / total).toFixed(0), p50ms: p(0.5), p95ms: p(0.95), p99ms: p(0.99), maxMs: lat.at(-1).toFixed(0), errors, codes,
}, null, 2));
