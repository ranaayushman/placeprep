"use client";

import { useActionState } from "react";
import { reportAction, type ReportState } from "@/app/(app)/community/actions";

const REASONS = { WRONG_ANSWER: "The answer is wrong", UNCLEAR: "The question is unclear", COPIED: "It's copied from somewhere", OTHER: "Something else" };

/** "Report a problem" on any question whose answer is shown. "Copied" only applies to community uploads. */
export function ReportProblem({ attemptQuestionId, community = false }: { attemptQuestionId: string; community?: boolean }) {
  const [state, action, pending] = useActionState<ReportState, FormData>(reportAction, undefined);
  if (state?.ok) return <p className="mt-3 text-xs text-slate-500">Thanks, we&apos;ll take a look.</p>;
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800">Report a problem</summary>
      <form action={action} className="mt-2 space-y-2">
        <input type="hidden" name="attemptQuestionId" value={attemptQuestionId} />
        <select name="reason" required defaultValue="" className="input" aria-label="What's wrong?">
          <option value="" disabled>What&apos;s wrong?</option>
          {Object.entries(REASONS).filter(([k]) => community || k !== "COPIED").map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <textarea name="details" maxLength={1000} rows={2} placeholder="Details (optional)" className="input" />
        {state?.error && <p className="text-xs text-red-700">{state.error}</p>}
        <button disabled={pending} className="btn-secondary">{pending ? "Sending…" : "Send report"}</button>
      </form>
    </details>
  );
}
