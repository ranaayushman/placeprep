import "server-only";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { RUN_MS, type Language, type RunStatus } from "./problems";

/**
 * Compiles and runs one C++17 (g++, or $CXX) or Java (javac/java, or $JAVA_HOME) program, or runs an SQL query
 * against each input script in `sqlite3 -safe` (no .shell/ATTACH, in-memory database), in a throwaway
 * directory, with a wall-clock limit and an output cap. The caller (actions.ts) gates who may use it.
 *
 * shortcut: no sandbox beyond timeouts and output caps; the program runs as the server user. Fine
 * for the owner's own practice; add a container or seccomp sandbox before opening it to students.
 */
export type { RunStatus };
export type RunResult = { status: RunStatus; stdout: string; stderr: string; timeMs: number };

export const CODE_LIMIT = 64 * 1024;
const OUTPUT_LIMIT = 64 * 1024;
const COMPILE_MS = 15_000;
const CXX = process.env.CXX ?? "g++";
const JAVA_BIN = process.env.JAVA_HOME ? `${process.env.JAVA_HOME}/bin/` : "";

/** Per language: source file name, compile command and how to run it. */
const LANG = {
  cpp: { file: "main.cpp", compile: (dir: string) => [CXX, ["-O2", "-std=c++17", "-I", dir, "main.cpp", "-o", "main"]] as const, run: (dir: string) => [path.join(dir, "main"), []] as const },
  java: { file: "Main.java", compile: () => [`${JAVA_BIN}javac`, ["-d", ".", "Main.java"]] as const, run: (dir: string) => [`${JAVA_BIN}java`, ["-Xmx256m", "-Xss64m", "-cp", dir, "Main"]] as const },
  python: { file: "main.py", compile: () => ["python3", ["-m", "py_compile", "main.py"]] as const, run: () => ["python3", ["main.py"]] as const },
  sql: { file: "query.sql", compile: null, run: () => ["sqlite3", ["-safe", "-bail", "-batch", ":memory:"]] as const },
};

/** Apple clang has no <bits/stdc++.h>; this shim is put on the include path for every compile. */
const BITS_STDCPP = `#pragma once
#include <algorithm>
#include <array>
#include <bitset>
#include <cassert>
#include <climits>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <functional>
#include <iomanip>
#include <iostream>
#include <iterator>
#include <limits>
#include <list>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
`;

const execFileP = promisify(execFile);
const clip = (s: string) => (s.length > OUTPUT_LIMIT ? s.slice(0, OUTPUT_LIMIT) + "\n… output truncated" : s);

/** Compiles `code` into `dir`; returns the compiler error text if it fails. */
async function compile(lang: Language, dir: string, code: string): Promise<{ error: string } | null> {
  if (lang === "cpp") {
    await mkdir(path.join(dir, "bits"));
    await writeFile(path.join(dir, "bits", "stdc++.h"), BITS_STDCPP);
  }
  await writeFile(path.join(dir, LANG[lang].file), code);
  const c = LANG[lang].compile;
  if (!c) return null;
  const [cmd, args] = c(dir);
  try {
    await execFileP(cmd, args, { cwd: dir, timeout: COMPILE_MS, maxBuffer: OUTPUT_LIMIT * 4 });
    return null;
  } catch (e) {
    const err = e as { killed?: boolean; stderr?: string; code?: string | number; message: string };
    if (err.killed) return { error: "Compilation timed out." };
    if (err.code === "ENOENT") return { error: `Compiler "${cmd}" is not installed on the server.` };
    return { error: clip(err.stderr?.replace(new RegExp(dir + "/", "g"), "") || err.message) };
  }
}

function execute(lang: Language, dir: string, stdin: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const [cmd, args] = LANG[lang].run(dir);
    const child = spawn(cmd, args, { cwd: dir, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let overflow = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, RUN_MS[lang]);
    const collect = (set: (s: string) => void, get: () => string) => (chunk: Buffer) => {
      set(get() + chunk.toString());
      if (get().length > OUTPUT_LIMIT) {
        overflow = true;
        child.kill("SIGKILL");
      }
    };
    child.stdout.on("data", collect((s) => (stdout = s), () => stdout));
    child.stderr.on("data", collect((s) => (stderr = s), () => stderr));
    child.stdin.on("error", () => {}); // program exited before reading all input
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ status: "runtime_error", stdout: clip(stdout), stderr: e.message, timeMs: Date.now() - t0 });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const timeMs = Date.now() - t0;
      const status: RunStatus = timedOut ? "timeout" : overflow ? "output_limit" : code === 0 ? "ok" : "runtime_error";
      const detail = status === "runtime_error" ? (signal ? `Killed by signal ${signal}` : `Exited with code ${code}`) : "";
      resolve({ status, stdout: clip(stdout), stderr: clip([stderr.trim(), detail].filter(Boolean).join("\n")), timeMs });
    });
    child.stdin.end(stdin);
  });
}

/** Same contract, served by the Go microservice (github.com/ranaayushman/placeprep-runner). Used when RUNNER_URL is set, e.g. on Vercel. */
async function runRemote(lang: Language, code: string, inputs: string[]): Promise<RunResult[]> {
  const res = await fetch(`${process.env.RUNNER_URL!.replace(/\/$/, "")}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RUNNER_TOKEN ?? ""}` },
    body: JSON.stringify({ language: lang, code, inputs }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`runner ${res.status}: ${(await res.text()).trim()}`);
  return ((await res.json()) as { results: RunResult[] }).results;
}

/** Compiles once, then runs the program on every input in order (stops early only on a compile error). */
export async function runCode(lang: Language, code: string, inputs: string[]): Promise<RunResult[]> {
  if (process.env.RUNNER_URL) return runRemote(lang, code, inputs);
  const dir = await mkdtemp(path.join(tmpdir(), `placeprep-${lang}-`));
  try {
    const failed = await compile(lang, dir, code);
    if (failed) return inputs.map(() => ({ status: "compile_error", stdout: "", stderr: failed.error, timeMs: 0 }));
    const out: RunResult[] = [];
    // SQL: the dataset script runs first, then the query, on the same in-memory database.
    for (const input of inputs) out.push(await execute(lang, dir, lang === "sql" ? `${input}\n${code}` : input));
    return out;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
