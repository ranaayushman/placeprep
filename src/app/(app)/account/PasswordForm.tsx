"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="font-medium">Current password</span>
        <input type="password" name="current" required autoComplete="current-password" maxLength={128} className="input mt-1" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">New password</span>
        <input type="password" name="next" required minLength={8} autoComplete="new-password" maxLength={128} className="input mt-1" />
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-emerald-700">Password changed. Every other device has been signed out.</p>}
      <button disabled={pending} className="btn-primary">{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
