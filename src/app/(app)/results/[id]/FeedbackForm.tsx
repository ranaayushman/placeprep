"use client";

import { useActionState } from "react";
import { feedbackAction, type FeedbackState } from "./actions";

const FIELDS = [
  { name: "product", label: "How was PlacePrep?", placeholder: "What you liked, what felt slow or confusing…" },
  { name: "questions", label: "About the questions", placeholder: "Too easy or hard? Any question that looked wrong? (mention its number)" },
  { name: "suggestions", label: "Suggestions", placeholder: "A topic, company or feature you'd like next" },
];

/** Optional feedback after a finished test. Shown once; replaced by a thank-you after sending. */
export function FeedbackForm({ attemptId, sent }: { attemptId: string; sent: boolean }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(feedbackAction, undefined);
  if (sent || state?.ok) {
    return <div className="card text-sm text-slate-600">Thanks for your feedback on this test. We read every message.</div>;
  }
  return (
    <details className="card" open>
      <summary className="cursor-pointer font-semibold">Tell us how this test went <span className="text-sm font-normal text-slate-500">(optional)</span></summary>
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="attemptId" value={attemptId} />
        {FIELDS.map((f) => (
          <label key={f.name} className="block text-sm">
            <span className="font-medium">{f.label}</span>
            <textarea name={f.name} maxLength={2000} rows={2} placeholder={f.placeholder} className="input mt-1" />
          </label>
        ))}
        {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        <button disabled={pending} className="btn-primary">{pending ? "Sending…" : "Send feedback"}</button>
      </form>
    </details>
  );
}
