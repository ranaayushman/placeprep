"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { LANGUAGES, RUN_MS, STARTER_CODE, verdict, type Language, type Problem } from "@/lib/code/problems";
import type { RunResult } from "@/lib/code/runner";
import { runAction, submitAction, type SubmitResult } from "../actions";

/** Everything the browser may see: the hidden tests stay on the server. */
export type PublicProblem = Omit<Problem, "tests">;
type Case = { input: string; expected?: string };
type Submission = { at: number; lang: Language; label: string; passed: number; total: number };
type Outcome = { kind: "run"; cases: Case[]; results: RunResult[] } | { kind: "submit"; result: SubmitResult };

const FILE: Record<Language, string> = { cpp: "main.cpp", java: "Main.java" };
const MAX_CASES = 10; // same cap as runAction
const tone = (label: string) => (label === "Accepted" ? "text-emerald-700" : "text-red-700");
const tab = (on: boolean) => `border-b-2 px-3 py-2 text-sm font-medium ${on ? "border-brand text-deep" : "border-transparent text-muted hover:text-deep"}`;
const chip = (on: boolean) => `rounded-md px-2.5 py-1 text-xs font-medium ${on ? "bg-brand-soft text-deep" : "bg-slate-100 text-muted hover:bg-slate-200"}`;

/**
 * LeetCode-style workspace: statement on the left, editor and test cases on the right. Code, custom
 * cases and past submissions are kept per problem in localStorage, so a reload never loses work.
 */
export type ProblemLink = Pick<Problem, "id" | "title" | "difficulty">;

export function Workspace({ problem: p, index, problems, prev, next }: { problem: PublicProblem; index: number; problems: ProblemLink[]; prev?: string; next?: string }) {
  const total = problems.length;
  const [lang, setLang] = useState<Language>("cpp");
  const key = `code:${p.id}:${lang}`;
  const [code, setCode] = useState<string>(STARTER_CODE.cpp);
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });
  const [cases, setCases] = useState<Case[]>(p.samples.map(({ input, output }) => ({ input, expected: output })));
  const [caseIdx, setCaseIdx] = useState(0);
  const [resultIdx, setResultIdx] = useState(0);
  const [left, setLeft] = useState<"description" | "submissions">("description");
  const [bottom, setBottom] = useState<"testcase" | "result">("testcase");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [pending, start] = useTransition();
  const gutter = useRef<HTMLPreElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [split, setSplit] = useState({ cols: 50, rows: 60 }); // % width of the statement pane, % height of the editor (desktop only)

  /** Drag a divider: the handle captures the pointer and reads its position against the pane it splits. */
  const resize = (axis: "cols" | "rows") => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const box = e.currentTarget.parentElement!.getBoundingClientRect();
    const onMove = (ev: PointerEvent) => {
      const pct = axis === "cols" ? ((ev.clientX - box.left) / box.width) * 100 : ((ev.clientY - box.top) / box.height) * 100;
      setSplit((s) => ({ ...s, [axis]: Math.min(80, Math.max(20, pct)) }));
    };
    const el = e.currentTarget;
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", () => el.removeEventListener("pointermove", onMove), { once: true });
  };
  const openDrawer = () => {
    setSolvedIds(new Set(problems.filter((q) => (JSON.parse(localStorage.getItem(`code:subs:${q.id}`) ?? "[]") as Submission[]).some((x) => x.label === "Accepted")).map((q) => q.id)));
    drawer.current?.showModal();
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("code:lang");
    if (savedLang && savedLang in LANGUAGES) setLang(savedLang as Language);
    setSubs(JSON.parse(localStorage.getItem(`code:subs:${p.id}`) ?? "[]"));
    setCases(p.samples.map(({ input, output }) => ({ input, expected: output }))); // the component is reused across problems
    setCaseIdx(0);
  }, [p]);
  useEffect(() => {
    setCode(localStorage.getItem(key) ?? STARTER_CODE[lang]);
    setOutcome(null); setError(null);
  }, [key, lang]);

  const switchLang = (l: Language) => { localStorage.setItem("code:lang", l); setLang(l); };
  const update = (v: string) => { setCode(v); localStorage.setItem(key, v); };
  const track = (el: HTMLTextAreaElement) => {
    const before = el.value.slice(0, el.selectionStart);
    setCursor({ ln: before.split("\n").length, col: before.length - before.lastIndexOf("\n") });
  };
  const show = (o: Outcome | null, err: string | null) => { setOutcome(o); setError(err); setResultIdx(0); setBottom("result"); };

  const doRun = () =>
    start(async () => {
      const snapshot = cases;
      const r = await runAction({ language: lang, code, stdins: snapshot.map((c) => c.input) });
      "error" in r ? show(null, r.error) : show({ kind: "run", cases: snapshot, results: r }, null);
    });
  const doSubmit = () =>
    start(async () => {
      const r = await submitAction({ problemId: p.id, language: lang, code });
      if ("error" in r) return show(null, r.error);
      const fail = r.cases.find((c) => !c.passed);
      const label = fail ? verdict(fail, fail.expected) : "Accepted";
      const list = [{ at: Date.now(), lang, label, passed: r.passed, total: r.total }, ...subs].slice(0, 20);
      setSubs(list);
      localStorage.setItem(`code:subs:${p.id}`, JSON.stringify(list));
      show({ kind: "submit", result: r }, null);
    });

  const solved = subs.some((s) => s.label === "Accepted");
  const lineNumbers = Array.from({ length: code.split("\n").length }, (_, i) => i + 1).join("\n");
  const navBtn = "rounded-md px-2 py-1 text-lg leading-none text-muted hover:bg-brand-soft hover:text-deep aria-disabled:pointer-events-none aria-disabled:opacity-30";

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-canvas text-slate-900">
      <header className="flex h-14 shrink-0 items-center gap-1 whitespace-nowrap border-b border-deep/10 bg-white/90 px-3 text-sm backdrop-blur">
        <Link href="/dashboard" aria-label="PlacePrep home" className="mr-1 shrink-0"><img src="/placeprep-icon.svg" alt="" className="h-8 w-8" /></Link>
        <button type="button" onClick={openDrawer} className="rounded-md px-2 py-1.5 font-medium text-muted hover:bg-brand-soft hover:text-deep">☰ <span className="hidden sm:inline">Problem </span>List</button>
        <Link href={prev ? `/code/${prev}` : "#"} aria-disabled={!prev} aria-label="Previous problem" className={navBtn}>‹</Link>
        <Link href={next ? `/code/${next}` : "#"} aria-disabled={!next} aria-label="Next problem" className={navBtn}>›</Link>
        <div className="mx-auto flex gap-1">
          <button type="button" onClick={doRun} disabled={pending} className="btn-secondary py-1.5">▶ Run</button>
          <button type="button" onClick={doSubmit} disabled={pending} className="btn-primary py-1.5">⬆ Submit</button>
        </div>
        <span className="hidden text-xs text-muted sm:inline">{index} / {total}</span>
      </header>

      <dialog ref={drawer} className="m-0 h-full max-h-none w-80 max-w-[85vw] overflow-y-auto border-r border-deep/10 bg-surface p-0 text-slate-900 shadow-xl backdrop:bg-deep/30" aria-label="Problem list">
        <div className="flex items-center justify-between border-b border-deep/10 px-4 py-3">
          <Link href="/code" className="font-semibold text-deep hover:underline" onClick={() => drawer.current?.close()}>All problems</Link>
          <button type="button" onClick={() => drawer.current?.close()} aria-label="Close" className="rounded-md px-2 py-1 text-muted hover:bg-brand-soft hover:text-deep">✕</button>
        </div>
        <ul className="divide-y divide-deep/10 text-sm">
          {problems.map((q, i) => (
            <li key={q.id}>
              <Link href={`/code/${q.id}`} onClick={() => drawer.current?.close()} aria-current={q.id === p.id ? "page" : undefined} className={`flex items-center gap-2 px-4 py-2.5 hover:bg-brand-soft ${q.id === p.id ? "bg-brand-soft/60 font-semibold text-deep" : ""}`}>
                <span className="w-4 text-emerald-700">{solvedIds.has(q.id) ? "✓" : ""}</span>
                <span className="w-6 text-muted">{i + 1}.</span>
                <span className="flex-1 truncate">{q.title}</span>
                <span className={`text-xs ${q.difficulty === "Easy" ? "text-emerald-700" : "text-amber-700"}`}>{q.difficulty}</span>
              </Link>
            </li>
          ))}
        </ul>
      </dialog>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 lg:flex-row lg:gap-0 lg:overflow-hidden">
        <section style={{ "--cols": `${split.cols}%` } as React.CSSProperties} className="flex flex-col rounded-2xl border border-deep/10 bg-surface shadow-sm lg:min-h-0 lg:[width:var(--cols)] lg:shrink-0">
          <nav className="flex shrink-0 border-b border-deep/10 px-2">
            <button type="button" className={tab(left === "description")} onClick={() => setLeft("description")}>Description</button>
            <button type="button" className={tab(left === "submissions")} onClick={() => setLeft("submissions")}>Submissions{subs.length ? ` (${subs.length})` : ""}</button>
          </nav>
          {left === "description" ? (
            <article className="space-y-5 overflow-y-auto p-5 text-[15px] leading-7">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-deep">{index}. {p.title}</h1>
                {solved && <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-700">Solved ✓</span>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-0.5 font-medium ${p.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{p.difficulty}</span>
                {p.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{t}</span>)}
              </div>
              <p>{p.statement}</p>
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
            </article>
          ) : (
            <div className="overflow-y-auto p-3 text-sm">
              {subs.length === 0 ? <p className="p-4 text-center text-muted">No submissions yet.</p> : (
                <table className="w-full">
                  <thead><tr className="text-left text-xs text-muted"><th className="py-1 font-medium">Status</th><th className="font-medium">Language</th><th className="font-medium">Tests</th><th className="font-medium">When</th></tr></thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr key={s.at} className="border-t border-deep/10">
                        <td className={`py-2 font-semibold ${tone(s.label)}`}>{s.label}</td>
                        <td>{LANGUAGES[s.lang]}</td>
                        <td className="tabular-nums">{s.passed}/{s.total}</td>
                        <td className="text-muted">{new Date(s.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>

        <div role="separator" aria-orientation="vertical" onPointerDown={resize("cols")} className="hidden w-2 shrink-0 cursor-col-resize rounded hover:bg-brand/30 lg:block" />
        <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:gap-0">
          <section style={{ "--rows": `${split.rows}%` } as React.CSSProperties} className="flex flex-col rounded-2xl border border-deep/10 bg-surface shadow-sm lg:min-h-0 lg:shrink-0 lg:[height:var(--rows)]">
            <div className="flex shrink-0 items-center gap-2 border-b border-deep/10 px-3 py-1.5 text-xs text-muted">
              <span className="font-semibold text-deep">{"</>"} Code</span>
              <span className="font-mono">· {FILE[lang]}</span>
              <select value={lang} onChange={(e) => switchLang(e.target.value as Language)} aria-label="Language" className="ml-auto rounded-md border border-slate-300 bg-white px-2 py-0.5 text-slate-700 focus:border-brand focus:outline-none">
                {Object.entries(LANGUAGES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
              <span>{RUN_MS[lang] / 1000} s limit</span>
              <button type="button" onClick={() => update(STARTER_CODE[lang])} disabled={pending} title="Reset to starter code" aria-label="Reset code" className="rounded p-1 hover:bg-brand-soft hover:text-deep">↺</button>
            </div>
            <div className="flex h-80 lg:h-auto lg:min-h-0 lg:flex-1">
              <pre ref={gutter} aria-hidden className="select-none overflow-hidden bg-canvas-deep py-3 pl-3 pr-2 text-right font-mono text-sm leading-6 text-slate-400">{lineNumbers}</pre>
              <textarea
                value={code}
                onChange={(e) => { update(e.target.value); track(e.currentTarget); }}
                onSelect={(e) => track(e.currentTarget)}
                onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop; }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); doRun(); return; }
                  if (e.key !== "Tab") return; // Tab inserts four spaces instead of leaving the editor.
                  e.preventDefault();
                  const el = e.currentTarget;
                  const pos = el.selectionStart + 4;
                  update(code.slice(0, el.selectionStart) + "    " + code.slice(el.selectionEnd));
                  requestAnimationFrame(() => { el.setSelectionRange(pos, pos); track(el); });
                }}
                spellCheck={false}
                wrap="off"
                className="flex-1 resize-none overflow-auto whitespace-pre bg-transparent py-3 pl-3 pr-3 font-mono text-sm leading-6 text-slate-900 caret-brand outline-none"
                aria-label={`${LANGUAGES[lang]} code`}
              />
            </div>
            <div className="flex shrink-0 justify-between rounded-b-2xl border-t border-deep/10 bg-canvas-deep px-3 py-1 text-xs text-muted">
              <span>{pending ? "Running…" : "Saved"}</span>
              <span className="tabular-nums">Ln {cursor.ln}, Col {cursor.col}</span>
            </div>
          </section>
          <div role="separator" aria-orientation="horizontal" onPointerDown={resize("rows")} className="hidden h-2 shrink-0 cursor-row-resize rounded hover:bg-brand/30 lg:block" />
          <section className="flex flex-col rounded-2xl border border-deep/10 bg-surface shadow-sm lg:min-h-0 lg:flex-1">
            <nav className="flex shrink-0 border-b border-deep/10 px-2">
              <button type="button" className={tab(bottom === "testcase")} onClick={() => setBottom("testcase")}>☑ Testcase</button>
              <button type="button" className={tab(bottom === "result")} onClick={() => setBottom("result")}>{">_"} Test Result</button>
            </nav>
            <div className="min-h-40 overflow-y-auto p-3 text-sm">
              {bottom === "testcase" ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {cases.map((_, i) => <button key={i} type="button" className={chip(i === caseIdx)} onClick={() => setCaseIdx(i)}>Case {i + 1}</button>)}
                    {cases.length < MAX_CASES && (
                      <button type="button" aria-label="Add test case" className={chip(false)} onClick={() => { setCases([...cases, { input: cases[caseIdx]?.input ?? "" }]); setCaseIdx(cases.length); }}>+</button>
                    )}
                    {cases.length > 1 && (
                      <button type="button" className="ml-auto text-xs text-muted hover:text-red-700" onClick={() => { setCases(cases.filter((_, i) => i !== caseIdx)); setCaseIdx(Math.max(0, caseIdx - 1)); }}>Remove case</button>
                    )}
                  </div>
                  <label className="mt-3 block text-xs text-muted">
                    Input {cases[caseIdx]?.expected !== undefined && <span className="text-slate-400">· sample, expected output known</span>}
                    <textarea
                      value={cases[caseIdx]?.input ?? ""}
                      onChange={(e) => setCases(cases.map((c, i) => (i === caseIdx ? { input: e.target.value } : c)))} // edited case loses its expected output
                      rows={4} spellCheck={false}
                      className="input mt-1 font-mono"
                    />
                  </label>
                </>
              ) : error ? (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</p>
              ) : !outcome ? (
                <p className="flex h-32 items-center justify-center text-muted">You must run your code first</p>
              ) : outcome.kind === "run" ? (
                <RunView cases={outcome.cases} results={outcome.results} idx={resultIdx} setIdx={setResultIdx} />
              ) : (
                <SubmitView result={outcome.result} />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Block({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted">{label}</p>
      <pre className={`overflow-x-auto whitespace-pre-wrap rounded-md p-2 font-mono text-sm ${bad ? "bg-red-50 text-red-700" : "bg-canvas-deep text-slate-900"}`}>{value.trimEnd() || " "}</pre>
    </div>
  );
}

function RunView({ cases, results, idx, setIdx }: { cases: Case[]; results: RunResult[]; idx: number; setIdx: (i: number) => void }) {
  const labels = results.map((r, i) => verdict(r, cases[i].expected));
  const overall = labels.find((l) => l !== "Accepted") ?? "Accepted";
  const r = results[idx];
  const c = cases[idx];
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3"><span className={`text-lg font-semibold ${tone(overall)}`}>{overall}</span><span className="text-xs text-muted">Runtime: {Math.max(...results.map((x) => x.timeMs))} ms</span></div>
      <div className="flex flex-wrap gap-2">
        {labels.map((l, i) => (
          <button key={i} type="button" className={chip(i === idx)} onClick={() => setIdx(i)}>
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${l === "Accepted" ? "bg-emerald-600" : "bg-red-500"}`} />Case {i + 1}
          </button>
        ))}
      </div>
      {r.status === "compile_error" ? <Block label="Compiler output" value={r.stderr} bad /> : (
        <>
          <Block label="Input" value={c.input} />
          <Block label="Output" value={r.stdout} bad={labels[idx] !== "Accepted"} />
          {r.stderr && <Block label="Stderr" value={r.stderr} bad />}
          {c.expected !== undefined && <Block label="Expected" value={c.expected} />}
        </>
      )}
    </div>
  );
}

function SubmitView({ result }: { result: SubmitResult }) {
  const fail = result.cases.find((c) => !c.passed);
  const label = fail ? verdict(fail, fail.expected) : "Accepted";
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span className={`text-lg font-semibold ${tone(label)}`}>{label}</span>
        <span className="text-xs text-muted">{result.passed} / {result.total} testcases passed · {Math.max(...result.cases.map((c) => c.timeMs))} ms</span>
      </div>
      {fail && (fail.status === "compile_error" ? <Block label="Compiler output" value={fail.stderr} bad /> : (
        <>
          <Block label="Input" value={fail.input} />
          <Block label="Output" value={fail.stdout} bad />
          {fail.stderr && <Block label="Stderr" value={fail.stderr} bad />}
          <Block label="Expected" value={fail.expected} />
        </>
      ))}
    </div>
  );
}
