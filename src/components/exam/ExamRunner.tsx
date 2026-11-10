"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamState, ViolationType } from "@/lib/exam/service";
import { OPTION_LETTERS, QuestionBody } from "@/components/QuestionBody";
import { ReportProblem } from "@/components/ReportProblem";
import { useProctoring } from "./useProctoring";
import { HEARTBEAT_MS, LEFT_AFTER_MS } from "@/lib/exam/pattern";
import { FaceProctoringTile } from "./CameraPreview";

type InProgress = Extract<ExamState, { status: "IN_PROGRESS" }>;
type Q = InProgress["current"]["questions"][number];

async function api<T>(attemptId: string, body?: object): Promise<T> {
  const res = await fetch(`/api/attempts/${attemptId}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Request failed"), { status: res.status });
  return data as T;
}

const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function ExamRunner({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [state, setState] = useState<InProgress | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Practice question whose answer is being checked by the server (options locked, "Checking…" shown). */
  const [checking, setChecking] = useState<string | null>(null);
  const shownAt = useRef(Date.now());
  const essayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMock = state?.mode === "MOCK";

  const goToResults = useCallback(() => router.replace(`/results/${attemptId}`), [router, attemptId]);

  const load = useCallback(async () => {
    try {
      const s = await api<ExamState>(attemptId);
      if (s.status === "SUBMITTED") return goToResults();
      setOffset(s.serverNow - Date.now());
      setState(s);
      setQuestions(s.current.questions);
      setIdx((i) => Math.min(i, s.current.questions.length - 1));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [attemptId, goToResults]);

  useEffect(() => {
    load();
  }, [load]);

  // Tells the server this page is still open. If it goes quiet (tab closed, left the page), the test is scored.
  useEffect(() => {
    const t = setInterval(async () => {
      const res = await api<{ submitted: boolean }>(attemptId, { action: "ping" }).catch(() => null);
      if (res?.submitted) router.replace(`/results/${attemptId}?auto=1`);
    }, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [attemptId, router]);

  // When the section changes, start from its first question.
  const sectionOrder = state?.current.order;
  useEffect(() => {
    setIdx(0);
    shownAt.current = Date.now();
  }, [sectionOrder]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const current = questions[idx];
  useEffect(() => {
    if (current) setVisited((v) => (v.has(current.id) ? v : new Set(v).add(current.id)));
  }, [current]);

  /** Time spent on the visible question since it was shown (sent with the next save). */
  const takeDelta = () => {
    const d = Date.now() - shownAt.current;
    shownAt.current = Date.now();
    return d;
  };

  const send = useCallback(
    async (q: Q, patch: { chosenIndex?: number | null; textAnswer?: string; marked?: boolean }, timeDeltaMs: number) => {
      const body = { action: "answer", questionId: q.id, timeDeltaMs, ...patch };
      for (let attempt = 0; ; attempt++) {
        try {
          const res = await api<{ feedback: Q["feedback"] }>(attemptId, body);
          if (res.feedback) setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, feedback: res.feedback } : x)));
          return;
        } catch (e) {
          const err = e as Error & { status?: number };
          // Network blips and server errors get one quiet retry; 4xx answers won't change on retry.
          if (attempt === 0 && (err.status === undefined || err.status >= 500)) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          // 409: section closed, time up, or already answered. Resync: the server's copy has any saved answer and feedback.
          if (err.status === 409) return load();
          setError(patch.chosenIndex !== undefined ? "Your answer didn't reach the server. Check your connection and tap it again." : err.message);
          if (patch.chosenIndex !== undefined) await load(); // show what the server actually saved
          return;
        }
      }
    },
    [attemptId, load],
  );

  const update = (patch: Partial<Pick<Q, "chosenIndex" | "textAnswer" | "marked">>) => {
    if (!current) return;
    setQuestions((qs) => qs.map((x) => (x.id === current.id ? { ...x, ...patch } : x)));
  };

  const choose = async (i: number) => {
    if (!current || current.feedback || checking === current.id) return;
    update({ chosenIndex: i });
    if (isMock) return void send(current, { chosenIndex: i }, takeDelta());
    // Practice: show right or wrong at once from the key sent with the question; save in the background.
    // If saving fails for good, send() reloads from the server, which clears the answer so it can be retried.
    if (current.key) {
      const { id, key } = current;
      setQuestions((qs) => qs.map((x) => (x.id === id ? { ...x, feedback: key } : x)));
      return void send(current, { chosenIndex: i }, takeDelta());
    }
    // No key (older tab): lock the options until the server says right or wrong.
    setChecking(current.id);
    try {
      await send(current, { chosenIndex: i }, takeDelta());
    } finally {
      setChecking(null);
    }
  };

  const clear = () => {
    if (!current || current.feedback) return;
    update({ chosenIndex: null });
    send(current, { chosenIndex: null }, takeDelta());
  };

  const toggleMark = () => {
    if (!current) return;
    update({ marked: !current.marked });
    send(current, { marked: !current.marked }, takeDelta());
  };

  const onEssay = (text: string) => {
    if (!current) return;
    update({ textAnswer: text });
    if (essayTimer.current) clearTimeout(essayTimer.current);
    const q = current;
    essayTimer.current = setTimeout(() => send(q, { textAnswer: text }, takeDelta()), 1200);
  };

  const go = (i: number) => {
    if (!current || i === idx) return;
    // Persist time spent on the question we're leaving. In practice, the clock stops at the answer:
    // reading the explanation (or waiting for it) is not time spent solving.
    const delta = takeDelta();
    if (isMock || current.chosenIndex == null) send(current, {}, delta);
    setIdx(i);
  };

  const submitSection = async () => {
    if (!state) return;
    setBusy(true);
    try {
      if (current) await send(current, current.view.kind === "essay" ? { textAnswer: current.textAnswer ?? "" } : {}, takeDelta());
      const res = await api<{ finished: boolean }>(attemptId, { action: "submit-section", sectionOrder: state.current.order });
      setConfirming(false);
      if (res.finished) return goToResults();
      await load();
    } catch {
      await load();
    } finally {
      setBusy(false);
    }
  };

  // ---- Timer: the server decides when time is up; the client only displays it. ----
  const endsAt = state?.current.endsAt ?? null;
  const remaining = endsAt ? endsAt - (now + offset) : null;
  const expiredRef = useRef(false);
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      // Give the server's grace window a moment, then resync (it will move us to the next section).
      setTimeout(async () => {
        await load();
        expiredRef.current = false;
      }, 1500);
    }
  }, [remaining, load]);

  const handleViolation = useCallback(
    async (type: ViolationType) => {
      try {
        const res = await api<{ violations: number; cameraAlerts: number; autoSubmitted: boolean }>(attemptId, { action: "violation", type });
        setState((s) => (s ? { ...s, violations: res.violations, cameraAlerts: res.cameraAlerts } : s));
        if (res.autoSubmitted) router.replace(`/results/${attemptId}?auto=1`);
      } catch {
        /* the next state load will reconcile */
      }
    },
    [attemptId, router],
  );

  const proctor = useProctoring({
    enabled: !!isMock,
    onViolation: handleViolation,
  });

  const counts = useMemo(() => {
    const answered = questions.filter((q) => q.chosenIndex != null || (q.textAnswer ?? "").trim()).length;
    const marked = questions.filter((q) => q.marked).length;
    return { answered, marked, total: questions.length, unanswered: questions.length - answered };
  }, [questions]);

  if (error && !state) return <div className="mx-auto max-w-lg p-10 text-center text-red-600">{error}</div>;
  if (!state || !current)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-100 text-slate-600" aria-busy="true">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" aria-hidden />
        <p className="text-sm">Loading your test…</p>
      </div>
    );

  const isLastSection = state.current.order === state.sections.length - 1;
  const lowTime = remaining !== null && remaining < 60_000;
  const passage = current.view.passage;

  return (
    <div className={`flex h-screen flex-col bg-slate-100 ${isMock ? "select-none" : ""}`}>
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500" title={`Leaving this page for more than ${LEFT_AFTER_MS / 60_000} minutes submits the test.`}>
            {state.title} <span className="normal-case tracking-normal">· leave for {LEFT_AFTER_MS / 60_000}+ min and it&apos;s submitted</span>
          </p>
          <p className="truncate text-base font-semibold text-slate-900">
            {isMock ? state.current.label : "Practice set"}
            {state.sections.length > 1 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                Section {state.current.order + 1} of {state.sections.length}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isMock && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${state.violations ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
              title="Leaving full screen, switching tabs or windows counts as a warning"
            >
              Warnings {state.violations}/{state.maxViolations}
            </span>
          )}
          {isMock && !state.cameraOff && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${state.cameraAlerts ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}
              title="Times your face wasn't visible, you looked away, or another face appeared. Shown on your result; never ends the test."
            >
              Camera alerts {state.cameraAlerts}
            </span>
          )}
          {isMock && !state.cameraOff && (
              <FaceProctoringTile
                enabled={!!isMock}
                onViolation={handleViolation}
              />
            )}
          <div
            className={`rounded-lg px-3 py-1.5 font-mono text-lg font-bold tabular-nums ${
              lowTime ? "animate-pulse bg-red-600 text-white" : "bg-slate-900 text-white"
            }`}
            aria-live="polite"
          >
            {remaining !== null ? fmtClock(remaining) : "Untimed"}
          </div>
        </div>
      </header>

      {/* Sections strip (mock) */}
      {state.sections.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-1.5">
          {state.sections.map((s) => (
            <span
              key={s.order}
              className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium ${
                s.order === state.current.order
                  ? "bg-indigo-600 text-white"
                  : s.order < state.current.order
                    ? "bg-slate-200 text-slate-500 line-through"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {s.label} · {Math.round(s.durationSec / 60)}m
            </span>
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Question area */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            {passage && (
              <aside className="hidden w-1/2 overflow-y-auto border-r border-slate-200 bg-white p-6 text-[15px] leading-relaxed text-slate-700 lg:block">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Passage</p>
                {passage}
              </aside>
            )}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto max-w-3xl">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    Question {idx + 1} of {questions.length}
                  </span>
                  {!isMock && <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{current.topic}</span>}
                </div>
                {passage && (
                  <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-[15px] leading-relaxed text-slate-700 lg:hidden">{passage}</div>
                )}
                <QuestionBody q={current.view} showPassage={false} />

                {current.view.kind === "mcq" ? (
                  <div className="mt-6 space-y-2.5" role="radiogroup">
                    {current.view.options.map((opt: string, i: number) => {
                      const chosen = current.chosenIndex === i;
                      const fb = current.feedback;
                      const tone = fb
                        ? i === fb.answerIndex
                          ? "border-emerald-500 bg-emerald-50"
                          : chosen
                            ? "border-red-500 bg-red-50"
                            : "border-slate-200 bg-white opacity-70"
                        : chosen
                          ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                          : "border-slate-200 bg-white hover:border-slate-400";
                      return (
                        <button
                          key={i}
                          role="radio"
                          aria-checked={chosen}
                          onClick={() => choose(i)}
                          disabled={!!fb || checking === current.id}
                          className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-[15px] transition ${tone}`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                              chosen ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-slate-500"
                            }`}
                          >
                            {OPTION_LETTERS[i]}
                          </span>
                          <span className="pt-0.5">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6">
                    <textarea
                      value={current.textAnswer ?? ""}
                      onChange={(e) => onEssay(e.target.value)}
                      onPaste={(e) => isMock && e.preventDefault()}
                      rows={14}
                      spellCheck={false}
                      placeholder="Write your answer here. Spell-check is disabled, as in the real test."
                      className="w-full rounded-lg border border-slate-300 p-4 text-[15px] leading-relaxed focus:border-indigo-600 focus:outline-none"
                    />
                    <p className={`mt-1 text-sm ${wordCount(current.textAnswer ?? "") >= (current.view.minWords ?? 0) ? "text-emerald-600" : "text-slate-500"}`}>
                      {wordCount(current.textAnswer ?? "")} words · aim for {current.view.minWords}–250
                    </p>
                  </div>
                )}

                {checking === current.id && !current.feedback && (
                  <p role="status" className="mt-5 flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" aria-hidden />
                    Checking your answer…
                  </p>
                )}
                {current.feedback && (
                  <div
                    className={`mt-5 rounded-lg border p-4 text-sm ${
                      current.chosenIndex === current.feedback.answerIndex ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"
                    }`}
                  >
                    <p className="font-semibold">
                      {current.chosenIndex === current.feedback.answerIndex
                        ? "Correct"
                        : `Incorrect — the answer is ${OPTION_LETTERS[current.feedback.answerIndex]}`}
                    </p>
                    <p className="mt-1 text-slate-700">{current.feedback.explanation}</p>
                    <ReportProblem attemptQuestionId={current.id} community={!!current.view.community} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex gap-2">
              <button onClick={toggleMark} className="btn-secondary">
                {current.marked ? "Unmark" : "Mark for review"}
              </button>
              {current.view.kind === "mcq" && !current.feedback && (
                <button onClick={clear} className="btn-secondary" disabled={current.chosenIndex == null}>
                  Clear response
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => go(idx - 1)} disabled={idx === 0} className="btn-secondary">
                ← Previous
              </button>
              {idx < questions.length - 1 ? (
                <button onClick={() => go(idx + 1)} className="btn-primary">
                  Save &amp; Next →
                </button>
              ) : (
                <button onClick={() => setConfirming(true)} className="btn-primary">
                  {isLastSection ? "Submit test" : "Submit section"}
                </button>
              )}
            </div>
          </footer>
        </main>

        {/* Palette */}
        <aside className="hidden w-72 shrink-0 flex-col border-l border-slate-200 bg-white p-4 md:flex">
          <p className="mb-3 text-sm font-semibold text-slate-700">Question palette</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const answered = q.chosenIndex != null || !!(q.textAnswer ?? "").trim();
              const cls = q.marked
                ? "bg-purple-600 text-white"
                : answered
                  ? "bg-emerald-600 text-white"
                  : visited.has(q.id)
                    ? "bg-red-500 text-white"
                    : "bg-slate-100 text-slate-600";
              return (
                <button
                  key={q.id}
                  onClick={() => go(i)}
                  className={`relative h-10 rounded-md text-sm font-semibold ${cls} ${i === idx ? "ring-2 ring-slate-900 ring-offset-1" : ""}`}
                >
                  {i + 1}
                  {q.marked && answered && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
                </button>
              );
            })}
          </div>
          <ul className="mt-5 space-y-1.5 text-xs text-slate-600">
            <li><span className="mr-2 inline-block h-3 w-3 rounded bg-emerald-600 align-middle" />Answered ({counts.answered})</li>
            <li><span className="mr-2 inline-block h-3 w-3 rounded bg-red-500 align-middle" />Visited, not answered</li>
            <li><span className="mr-2 inline-block h-3 w-3 rounded bg-slate-200 align-middle" />Not visited</li>
            <li><span className="mr-2 inline-block h-3 w-3 rounded bg-purple-600 align-middle" />Marked for review ({counts.marked})</li>
          </ul>
          <div className="mt-auto space-y-2 pt-4">
            {isMock && <p className="text-xs leading-relaxed text-slate-500">No negative marking — attempt every question. You cannot return to this section after submitting it.</p>}
            <button onClick={() => setConfirming(true)} className="btn-danger w-full">
              {isLastSection ? "Submit test" : "Submit section"}
            </button>
          </div>
        </aside>
      </div>

      {/* Confirm submit */}
      {confirming && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{isLastSection ? "Submit the test?" : `Submit ${state.current.label}?`}</h2>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-emerald-50 p-3"><dt className="text-xs text-slate-500">Answered</dt><dd className="text-xl font-bold text-emerald-700">{counts.answered}</dd></div>
              <div className="rounded-lg bg-red-50 p-3"><dt className="text-xs text-slate-500">Unanswered</dt><dd className="text-xl font-bold text-red-600">{counts.unanswered}</dd></div>
              <div className="rounded-lg bg-purple-50 p-3"><dt className="text-xs text-slate-500">Marked</dt><dd className="text-xl font-bold text-purple-700">{counts.marked}</dd></div>
            </dl>
            {!isLastSection && <p className="mt-4 text-sm text-slate-600">You will not be able to come back to this section.</p>}
            {counts.unanswered > 0 && <p className="mt-2 text-sm font-medium text-amber-700">There is no negative marking — consider answering the remaining questions.</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConfirming(false)} className="btn-secondary">Go back</button>
              <button onClick={submitSection} disabled={busy} className="btn-primary">{busy ? "Submitting…" : "Yes, submit"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring gate */}
      {isMock && proctor.blocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-xl">
            <h2 className="text-lg font-semibold">{proctor.everEntered ? "You left full screen" : "Exam full screen required"}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {proctor.everEntered
                ? `This was recorded as a warning (${state.violations}/${state.maxViolations}). At ${state.maxViolations} warnings the test is submitted automatically. Your timer is still running.`
                : "Use the button below to enter the browser's exam fullscreen mode. Maximising the window or pressing F11 does not enable this mode."}
            </p>
            <button onClick={proctor.enterFullscreen} className="btn-primary mt-5">
              {proctor.everEntered ? "Return to full screen" : "Enter full screen & start"}
            </button>
            {!proctor.supported && <p className="mt-3 text-xs text-amber-700">Your browser does not support full screen; proctoring will rely on tab-switch detection only.</p>}
          </div>
        </div>
      )}

      {proctor.toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{proctor.toast}</div>
      )}
      {error && state && (
        <div className="fixed bottom-20 right-4 z-50 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </div>
  );
}
