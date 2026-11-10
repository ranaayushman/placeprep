"use client";

import { useActionState } from "react";
import { requestDeletionAction, type DeletionState } from "./actions";

export function DeletionForm() {
  const [state, action, pending] = useActionState<DeletionState, FormData>(requestDeletionAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="font-medium">Why are you leaving? <span className="font-normal text-slate-500">(optional)</span></span>
        <textarea name="reason" maxLength={500} rows={2} className="input mt-1" />
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="confirm" required className="mt-0.5" />
        <span>I understand that my account, tests, results and community questions will be permanently deleted and can&apos;t be recovered.</span>
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-danger">{pending ? "Sending…" : "Request deletion"}</button>
    </form>
  );
}
