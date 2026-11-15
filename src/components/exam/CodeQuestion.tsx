"use client";

import { useEffect, useState } from "react";
import type { SubmitResult } from "@/lib/code/judge";
import { LANGUAGES, RUN_MS, STARTER_CODE, verdict, type Language } from "@/lib/code/problems";
import type { RunResult } from "@/lib/code/runner";
import type { QuestionView } from "@/lib/questions/types";

export type CodeAnswer = { language: Language; code: string; passed: number; total: number };
type Props = {
  questionId: string;
  view: QuestionView;
  /** The last saved submission (JSON of CodeAnswer), if any. */
  textAnswer: string | null;
  mock: boolean;
  run: (language: Language, code: string, stdin: string) => Promise<RunResult>;
  submit: (language: Language, code: string) => Promise<SubmitResult & { accepted: boolean }>;
};

export const parseCodeAnswer = (s: string | null): CodeAnswer | null => {
  try {
    const v = s ? (JSON.parse(s) as CodeAnswer) : null;
    return v && typeof v.code === "string" && v.language in LANGUAGES ? v : null;
  } catch {
    return null;
  }
};

const dark = "rounded-md border border-slate-800 bg-slate-800/60 p-2 font-mono text-xs text-slate-100 outline-none focus:border-emerald-500/60";

/** One coding question inside a test: statement on the left, a dark editor with Run / Submit on the right. */
export function CodeQuestion({ questionId, view, textAnswer, mock, run, submit }: Props) {
  const p = view.problem!;
  const saved = parseCodeAnswer(textAnswer);
  const [lang, setLang] = useState<Language>(saved?.language ?? "cpp");
  const key = `exam-code:${questionId}:${lang}`;
  const [code, setCode] = useState(saved?.code ?? STARTER_CODE.cpp);
  const [stdin, setStdin] = useState(p.samples[0]?.input ?? "");
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [out, setOut] = useState<{ run?: RunResult; sub?: SubmitResult & { accepted: boolean }; error?: string } | null>(null);

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
    try {
      setOut(what === "run" ? { run: await run(lang, code, stdin) } : { sub: await submit(lang, code) });
    } catch (e) {
      setOut({ error: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <article className="space-y-4 text-[15px] leading-relaxed text-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.difficulty} · judged on hidden tests · C++ or Java</p>
        <p>{view.prompt}</p>
        <dl className="space-y-1.5 text-sm">
          <div><dt className="inline font-semibold">Input: </dt><dd className="inline">{p.input}</dd></div>
          <div><dt className="inline font-semibold">Output: </dt><dd className="inline">{p.output}</dd></div>
          <div><dt className="inline font-semibold">Constraints: </dt><dd className="inline font-mono text-xs">{p.constraints}</dd></div>
        </dl>
        {p.samples.map((s, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="mb-2 font-semibold">Sample {i + 1}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 font-mono text-xs"><span className="text-slate-400">Input</span>{"\n"}{s.input}</pre>
              <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 font-mono text-xs"><span className="text-slate-400">Output</span>{"\n"}{s.output}</pre>
            </div>
            {s.note && <p className="mt-2 text-slate-600">{s.note}</p>}
          </div>
        ))}
        {saved && (
          <p className={`text-sm font-medium ${saved.passed === saved.total ? "text-emerald-700" : "text-amber-700"}`}>
            Last submission ({LANGUAGES[saved.language]}): {saved.passed}/{saved.total} tests passed. You can submit again until the section ends.
          </p>
        )}
      </article>

      <section className="space-y-2 rounded-xl bg-[#0d1117] p-3 text-slate-200 ring-1 ring-slate-800">
        <div className="flex items-center gap-2 px-1 font-mono text-xs text-slate-400">
          <span>{lang === "cpp" ? "main.cpp" : "Main.java"}</span>
          <select value={lang} onChange={(e) => setLang(e.target.value as Language)} aria-label="Language" className="ml-auto rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-200">
            {Object.entries(LANGUAGES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <span>· {RUN_MS[lang] / 1000} s limit</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => update(e.target.value)}
          onPaste={(e) => mock && e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key !== "Tab") return; // Tab indents instead of leaving the editor
            e.preventDefault();
            const el = e.currentTarget;
            const pos = el.selectionStart + 4;
            update(code.slice(0, el.selectionStart) + "    " + code.slice(el.selectionEnd));
            requestAnimationFrame(() => el.setSelectionRange(pos, pos));
          }}
          spellCheck={false}
          rows={18}
          aria-label={`${LANGUAGES[lang]} code`}
          className="w-full resize-y rounded-lg border border-slate-800 bg-[#161b22] p-3 font-mono text-sm leading-6 text-emerald-100 caret-emerald-400 outline-none focus:border-emerald-500/60"
        />
        <label className="block text-xs text-slate-400">
          Custom input for Run
          <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={2} spellCheck={false} className={`mt-1 w-full ${dark}`} />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => go("run")} disabled={!!busy} className="rounded-md border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-medium hover:bg-slate-700 disabled:opacity-50">{busy === "run" ? "Running…" : "▶ Run"}</button>
          <button type="button" onClick={() => go("submit")} disabled={!!busy} className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">{busy === "submit" ? "Judging…" : "Submit answer"}</button>
          <button type="button" onClick={() => update(STARTER_CODE[lang])} disabled={!!busy} className="ml-auto text-xs text-slate-500 hover:text-slate-300">Reset code</button>
        </div>
        {out?.error && <p role="alert" className="rounded-md border border-red-900 bg-red-950/60 px-3 py-2 text-sm text-red-300">{out.error}</p>}
        {out?.run && (
          <div className="space-y-1 rounded-lg border border-slate-800 bg-[#161b22] p-3 font-mono text-xs">
            <p className={out.run.status === "ok" ? "text-emerald-400" : "text-red-400"}>{verdict(out.run)} · {out.run.timeMs} ms</p>
            {out.run.stdout && <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-black/40 p-2">{out.run.stdout}</pre>}
            {out.run.stderr && <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-red-950/50 p-2 text-red-300">{out.run.stderr}</pre>}
          </div>
        )}
        {out?.sub && (
          <div className="space-y-2 rounded-lg border border-slate-800 bg-[#161b22] p-3 font-mono text-xs">
            <p className={`text-sm font-semibold ${out.sub.accepted ? "text-emerald-400" : "text-red-400"}`}>
              {out.sub.accepted ? "Accepted" : (verdict(out.sub.cases.find((c) => !c.passed)!, out.sub.cases.find((c) => !c.passed)!.expected || undefined))} · {out.sub.passed}/{out.sub.total} tests passed
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {out.sub.cases.map((c, i) => (
                <li key={i} className={`rounded px-2 py-0.5 ${c.passed ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"}`}>{c.hidden ? `Hidden ${i + 1 - p.samples.length}` : `Sample ${i + 1}`} {c.passed ? "✓" : "✗"}</li>
              ))}
            </ul>
            {out.sub.cases.filter((c) => !c.passed && !c.hidden).slice(0, 1).map((c, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-3">
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-black/40 p-2"><span className="text-slate-500">Input</span>{"\n"}{c.input}</pre>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-black/40 p-2"><span className="text-slate-500">Expected</span>{"\n"}{c.expected}</pre>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-red-950/50 p-2 text-red-300"><span className="text-slate-500">Got</span>{"\n"}{c.stdout}{c.stderr}</pre>
              </div>
            ))}
            {out.sub.cases[0]?.status === "compile_error" && <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-red-950/50 p-2 text-red-300">{out.sub.cases[0].stderr}</pre>}
          </div>
        )}
      </section>
    </div>
  );
}
