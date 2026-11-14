import "server-only";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

/**
 * Compiles and runs one C++17 program with the system compiler (g++, or $CXX), in a throwaway
 * directory, with a wall-clock limit and an output cap. The caller (actions.ts) gates who may use it.
 *
 * shortcut: no sandbox beyond timeouts and output caps; the program runs as the server user. Fine
 * for the owner's own practice; add a container or seccomp sandbox before opening it to students.
 */
export type RunStatus = "ok" | "compile_error" | "runtime_error" | "timeout" | "output_limit";
export type RunResult = { status: RunStatus; stdout: string; stderr: string; timeMs: number };

export const CODE_LIMIT = 64 * 1024;
const OUTPUT_LIMIT = 64 * 1024;
const COMPILE_MS = 15_000;
const RUN_MS = 2_000;
const CXX = process.env.CXX ?? "g++";

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

/** Compiles `code`; on success returns the binary path inside `dir`. */
async function compile(dir: string, code: string): Promise<{ bin: string } | { error: string }> {
  await mkdir(path.join(dir, "bits"));
  await writeFile(path.join(dir, "bits", "stdc++.h"), BITS_STDCPP);
  await writeFile(path.join(dir, "main.cpp"), code);
  const bin = path.join(dir, "main");
  try {
    await execFileP(CXX, ["-O2", "-std=c++17", "-I", dir, "main.cpp", "-o", bin], { cwd: dir, timeout: COMPILE_MS, maxBuffer: OUTPUT_LIMIT * 4 });
    return { bin };
  } catch (e) {
    const err = e as { killed?: boolean; stderr?: string; code?: string | number; message: string };
    if (err.killed) return { error: "Compilation timed out." };
    if (err.code === "ENOENT") return { error: `Compiler "${CXX}" is not installed on the server.` };
    return { error: clip(err.stderr?.replace(new RegExp(dir + "/", "g"), "") || err.message) };
  }
}

function execute(bin: string, stdin: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(bin, [], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let overflow = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, RUN_MS);
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

/** Compiles once, then runs the program on every input in order (stops early only on a compile error). */
export async function runCpp(code: string, inputs: string[]): Promise<RunResult[]> {
  const dir = await mkdtemp(path.join(tmpdir(), "placeprep-cpp-"));
  try {
    const built = await compile(dir, code);
    if ("error" in built) return inputs.map(() => ({ status: "compile_error", stdout: "", stderr: built.error, timeMs: 0 }));
    const out: RunResult[] = [];
    for (const input of inputs) out.push(await execute(built.bin, input));
    return out;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
