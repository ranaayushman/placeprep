"use client";

import { useEffect, useState, useTransition } from "react";
import { STARTER_CODE } from "@/lib/code/problems";
import type { RunResult } from "@/lib/code/runner";
import { runAction, submitAction, type SubmitResult } from "../actions";

const STATUS: Record<RunResult["status"], string> = { ok: "Ran", compile_error: "Compilation error", runtime_error: "Runtime error", timeout: "Time limit exceeded (2 s)", output_limit: "Output limit exceeded" };

/** Plain-textarea C++ editor. Code is kept per problem in localStorage, so a reload never loses work. */
export function Editor({ problemId, sampleInput }: { problemId: string; sampleInput: string }) {
  const key = `code:${problemId}`;
  const [code, setCode] = useState(STARTER_CODE);
  const [stdin, setStdin] = useState(sampleInput);
  const [run, setRun] = useState<RunResult | null>(null);
  const [submit, setSubmit] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) setCode(saved);
  }, [key]);
  const update = (v: string) => {
    setCode(v);
    localStorage.setItem(key, v);
  };

  const doRun = () =>
    start(async () => {
      setError(null); setSubmit(null);
      const r = await runAction({ code, stdin });
      "error" in r ? setError(r.error) : setRun(r);
    });
  const doSubmit = () =>
    start(async () => {
      setError(null); setRun(null);
      const r = await submitAction({ problemId, code });
      "error" in r ? setError(r.error) : setSubmit(r);
    });

  return (
    <section className="space-y-3 rounded-xl bg-[#0d1117] p-3 text-slate-200 shadow-lg ring-1 ring-slate-800">
      <div className="flex items-center gap-2 px-1 font-mono text-xs text-slate-400">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" /><span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        <span className="ml-2">main.cpp</span><span className="ml-auto">C++17 · g++ -O2</span>
      </div>
      <textarea
        value={code}
        onChange={(e) => update(e.target.value)}
        onKeyDown={(e) => {
          // Tab inserts four spaces instead of leaving the editor.
          if (e.key !== "Tab") return;
          e.preventDefault();
          const el = e.currentTarget;
          const next = code.slice(0, el.selectionStart) + "    " + code.slice(el.selectionEnd);
          const pos = el.selectionStart + 4;
          update(next);
          requestAnimationFrame(() => el.setSelectionRange(pos, pos));
        }}
        spellCheck={false}
        rows={22}
        className="w-full resize-y rounded-lg border border-slate-800 bg-[#161b22] p-3 font-mono text-sm leading-6 text-emerald-100 caret-emerald-400 outline-none focus:border-emerald-500/60"
        aria-label="C++ code"
      />
      <label className="block text-sm">
        <span className="font-mono text-xs text-slate-400">stdin</span>
        <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3} spellCheck={false} className="mt-1 w-full rounded-lg border border-slate-800 bg-[#161b22] p-2 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500/60" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={doRun} disabled={pending} className="rounded-md border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-50">{pending ? "Working…" : "▶ Run"}</button>
        <button type="button" onClick={doSubmit} disabled={pending} className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">{pending ? "Working…" : "Submit"}</button>
        <button type="button" onClick={() => update(STARTER_CODE)} disabled={pending} className="ml-auto text-sm text-slate-500 hover:text-slate-300">Reset code</button>
      </div>
      {error && <p role="alert" className="rounded-md border border-red-900 bg-red-950/60 px-3 py-2 text-sm text-red-300">{error}</p>}
      {run && (
        <div className="space-y-2 rounded-lg border border-slate-800 bg-[#161b22] p-3 font-mono text-sm">
          <div className="flex justify-between"><span className={`font-semibold ${run.status === "ok" ? "text-emerald-400" : "text-red-400"}`}>{STATUS[run.status]}</span><span className="text-slate-500">{run.timeMs} ms</span></div>
          {run.stdout && <pre className="overflow-x-auto rounded-md bg-black/40 p-2 text-xs text-slate-100">{run.stdout}</pre>}
          {run.stderr && <pre className="overflow-x-auto rounded-md bg-red-950/50 p-2 text-xs text-red-300">{run.stderr}</pre>}
        </div>
      )}
      {submit && (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-[#161b22] p-3 font-mono text-sm">
          <div className={`font-semibold ${submit.passed === submit.total ? "text-emerald-400" : "text-red-400"}`}>
            {submit.passed === submit.total ? "Accepted" : "Not yet"} · {submit.passed}/{submit.total} tests passed
          </div>
          {submit.cases.map((c, i) => (
            <details key={i} open={!c.passed} className="rounded-md border border-slate-800 p-2">
              <summary className="cursor-pointer">
                <span className={c.passed ? "text-emerald-400" : "text-red-400"}>{c.passed ? "✓" : "✗"}</span> Test {i + 1} · {c.passed ? "passed" : c.status === "ok" ? "wrong answer" : STATUS[c.status]} · {c.timeMs} ms
              </summary>
              {!c.passed && (
                <div className="mt-2 grid gap-2 font-mono text-xs sm:grid-cols-3">
                  <pre className="overflow-x-auto rounded-md bg-black/40 p-2"><span className="text-slate-500">Input</span>{"\n"}{c.input}</pre>
                  <pre className="overflow-x-auto rounded-md bg-black/40 p-2"><span className="text-slate-500">Expected</span>{"\n"}{c.expected}</pre>
                  <pre className="overflow-x-auto rounded-md bg-red-950/50 p-2 text-red-300"><span className="text-slate-500">Got</span>{"\n"}{c.stdout}{c.stderr}</pre>
                </div>
              )}
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
