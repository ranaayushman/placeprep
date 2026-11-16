"use client";

import { useEffect, useRef, useState } from "react";
import type { SubmitResult } from "@/lib/code/judge";
import { LANGUAGES, parseCodeAnswer, RUN_MS, STARTER_CODE, verdict, type Language } from "@/lib/code/problems";
import type { RunResult } from "@/lib/code/runner";
import type { QuestionView } from "@/lib/questions/types";

type Props = {
  questionId: string;
  view: QuestionView;
  /** The last saved submission (JSON of CodeAnswer), if any. */
  textAnswer: string | null;
  mock: boolean;
  run: (language: Language, code: string, stdin: string) => Promise<RunResult>;
  submit: (language: Language, code: string) => Promise<SubmitResult & { accepted: boolean }>;
};

/** One coding question inside a test: statement on the left, a workspace-style editor on the right. */
export function CodeQuestion({ questionId, view, textAnswer, mock, run, submit }: Props) {
  const p = view.problem!;
  const saved = parseCodeAnswer(textAnswer);
  const langs = p.languages as Language[];
  const [lang, setLang] = useState<Language>(saved?.language ?? langs[0]);
  const key = `exam-code:${questionId}:${lang}`;
  const [code, setCode] = useState(saved?.code ?? STARTER_CODE[langs[0]]);
  const [stdin, setStdin] = useState(p.samples[0]?.input ?? "");
  const [bottom, setBottom] = useState<"testcase" | "result">("testcase");
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [out, setOut] = useState<{ run?: RunResult; sub?: SubmitResult & { accepted: boolean }; error?: string } | null>(null);
  const gutter = useRef<HTMLPreElement>(null);

  // Drafts survive a reload; the server only ever has the last submitted code.
  useEffect(() => {
    setCode(localStorage.getItem(key) ?? (saved?.language === lang ? saved.code : STARTER_CODE[lang]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = (v: string) => {
    setCode(v);
    localStorage.setItem(key, v);
  };
  const go = async (what: "run" | "submit") => {
    setBusy(what);
    setOut(null);
    setBottom("result");
    try {
      setOut(what === "run" ? { run: await run(lang, code, stdin) } : { sub: await submit(lang, code) });
    } catch (e) {
      setOut({ error: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-2 lg:grid-cols-2">
      <article className="min-h-0 overflow-y-auto rounded-2xl border border-deep/10 bg-surface p-5 text-[15px] leading-7 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{p.difficulty} · judged on hidden tests</p>
            <h2 className="mt-1 text-xl font-bold text-deep">{view.prompt}</h2>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-deep">C++ / Java</span>
        </div>
        <div className="space-y-3">
          <p><span className="font-semibold text-deep">Input:</span> {p.input}</p>
          <p><span className="font-semibold text-deep">Output:</span> {p.output}</p>
          {p.samples.map((s, i) => (
            <div key={i}>
              <p className="font-semibold text-deep">Example {i + 1}:</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-r-lg border-l-2 border-brand bg-canvas-deep p-3 font-mono text-sm leading-6">
                <span className="font-semibold text-deep">Input:</span>{"\n"}{s.input.trimEnd()}{"\n"}<span className="font-semibold text-deep">Output:</span>{"\n"}{s.output.trimEnd()}
                {s.note && <>{"\n"}<span className="font-semibold text-deep">Explanation:</span>{"\n"}{s.note}</>}
              </pre>
            </div>
          ))}
          <p><span className="font-semibold text-deep">Constraints:</span> <code className="font-mono text-sm">{p.constraints}</code></p>
        </div>
        {saved && <p className={`mt-5 text-sm font-medium ${saved.passed === saved.total ? "text-emerald-700" : "text-amber-700"}`}>Last submission ({LANGUAGES[saved.language]}): {saved.passed}/{saved.total} tests passed.</p>}
      </article>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-deep/10 bg-surface shadow-sm">
        <div className="flex shrink-0 items-center gap-2 border-b border-deep/10 px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-deep">{"</>"} Code</span>
          <span className="font-mono">· {lang === "cpp" ? "main.cpp" : "Main.java"}</span>
          <select value={lang} onChange={(e) => setLang(e.target.value as Language)} aria-label="Language" className="ml-auto rounded-md border border-slate-300 bg-white px-2 py-0.5 text-slate-700">
            {langs.map((id) => <option key={id} value={id}>{LANGUAGES[id]}</option>)}
          </select>
          <span>· {RUN_MS[lang] / 1000} s limit</span>
          <button type="button" onClick={() => update(STARTER_CODE[lang])} disabled={!!busy} title="Reset code" aria-label="Reset code" className="rounded p-1 hover:bg-brand-soft hover:text-deep">↺</button>
        </div>
        <div className="flex min-h-64 flex-1">
          <pre ref={gutter} aria-hidden className="select-none overflow-hidden bg-canvas-deep py-3 pl-3 pr-2 text-right font-mono text-sm leading-6 text-slate-400">{Array.from({ length: code.split("\n").length }, (_, i) => i + 1).join("\n")}</pre>
          <textarea
            value={code}
            onChange={(e) => update(e.target.value)}
            onPaste={(e) => mock && e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              e.preventDefault();
              const el = e.currentTarget;
              const pos = el.selectionStart + 4;
              update(code.slice(0, el.selectionStart) + "    " + code.slice(el.selectionEnd));
              requestAnimationFrame(() => el.setSelectionRange(pos, pos));
            }}
            onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop; }}
            spellCheck={false}
            aria-label={`${LANGUAGES[lang]} code`}
            className="min-h-full flex-1 resize-none overflow-auto whitespace-pre bg-transparent p-3 font-mono text-sm leading-6 text-slate-900 caret-brand outline-none"
          />
        </div>
        <div className="flex shrink-0 gap-2 border-t border-deep/10 bg-canvas-deep px-3 py-2">
          <button type="button" onClick={() => go("run")} disabled={!!busy} className="btn-secondary py-1.5">{busy === "run" ? "Running…" : "▶ Run"}</button>
          <button type="button" onClick={() => go("submit")} disabled={!!busy} className="btn-primary py-1.5">{busy === "submit" ? "Judging…" : "⬆ Submit"}</button>
        </div>
        <nav className="flex shrink-0 border-y border-deep/10 px-2">
          <button type="button" className={`border-b-2 px-3 py-2 text-sm font-medium ${bottom === "testcase" ? "border-brand text-deep" : "border-transparent text-muted"}`} onClick={() => setBottom("testcase")}>☑ Testcase</button>
          <button type="button" className={`border-b-2 px-3 py-2 text-sm font-medium ${bottom === "result" ? "border-brand text-deep" : "border-transparent text-muted"}`} onClick={() => setBottom("result")}>{">_"} Test Result</button>
        </nav>
        <div className="max-h-56 min-h-28 overflow-y-auto p-3 text-sm">
          {bottom === "testcase" ? (
            <label className="block text-xs text-muted">Input for Run<textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3} spellCheck={false} className="input mt-1 font-mono" /></label>
          ) : out?.error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{out.error}</p> : out?.run ? (
            <div className="space-y-1 font-mono text-xs"><p className={out.run.status === "ok" ? "text-emerald-700" : "text-red-700"}>{verdict(out.run)} · {out.run.timeMs} ms</p>{out.run.stdout && <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-canvas-deep p-2">{out.run.stdout}</pre>}{out.run.stderr && <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-red-50 p-2 text-red-700">{out.run.stderr}</pre>}</div>
          ) : out?.sub ? (
            <div className="space-y-2 font-mono text-xs">
            <p className={`text-sm font-semibold ${out.sub.accepted ? "text-emerald-700" : "text-red-700"}`}>
              {out.sub.accepted ? "Accepted" : (verdict(out.sub.cases.find((c) => !c.passed)!, out.sub.cases.find((c) => !c.passed)!.expected || undefined))} · {out.sub.passed}/{out.sub.total} tests passed
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {out.sub.cases.map((c, i) => (
                <li key={i} className={`rounded px-2 py-0.5 ${c.passed ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"}`}>{c.hidden ? `Hidden ${i + 1 - p.samples.length}` : `Sample ${i + 1}`} {c.passed ? "✓" : "✗"}</li>
              ))}
            </ul>
            {out.sub.cases.filter((c) => !c.passed && !c.hidden).slice(0, 1).map((c, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-3">
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-canvas-deep p-2"><span className="text-slate-500">Input</span>{"\n"}{c.input}</pre>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-canvas-deep p-2"><span className="text-slate-500">Expected</span>{"\n"}{c.expected}</pre>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-red-50 p-2 text-red-700"><span className="text-slate-500">Got</span>{"\n"}{c.stdout}{c.stderr}</pre>
              </div>
            ))}
            {out.sub.cases[0]?.status === "compile_error" && <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-red-50 p-2 text-red-700">{out.sub.cases[0].stderr}</pre>}
            </div>
          ) : <p className="flex h-24 items-center justify-center text-muted">Run your code to see the result.</p>}
        </div>
      </section>
    </div>
  );
}
