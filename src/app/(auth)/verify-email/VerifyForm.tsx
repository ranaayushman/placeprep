"use client";

import { useActionState } from "react";
import { logout, resendCode, verifyEmail, type VerifyState } from "../actions";
import { AuthShell, FIELD, LABEL, SUBMIT } from "../AuthShell";

export function VerifyForm({ email, sendFailed }: { email: string; sendFailed: boolean }) {
  const [state, verify, verifying] = useActionState<VerifyState, FormData>(verifyEmail, undefined);
  const [resent, resend, resending] = useActionState<VerifyState>(resendCode, undefined);
  const error = state?.error ?? (sendFailed && !resent ? "We couldn't send the email. Use “Send a new code” below." : undefined);

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
      <p className="mt-2 text-muted">
        We sent a 6-digit code to <span className="font-medium text-deep">{email}</span>. It expires in 10 minutes. Can&apos;t find it? Check your spam folder.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={verify} className="mt-6 space-y-4">
        <div>
          <label htmlFor="code" className={LABEL}>Verification code</label>
          <input id="code" name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="123456" className={`${FIELD} text-center font-mono text-xl tracking-[0.5em]`} />
        </div>
        <button className={SUBMIT} disabled={verifying}>{verifying ? "Checking…" : "Verify email"}</button>
      </form>

      {resent && (
        <p role="status" className={`mt-6 text-sm ${resent.error ? "text-danger" : "text-success"}`}>
          {resent.error ?? resent.info}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between text-sm">
        <form action={resend}>
          <button className="font-medium text-brand underline disabled:opacity-60" disabled={resending}>{resending ? "Sending…" : "Send a new code"}</button>
        </form>
        <form action={logout}>
          <button className="text-muted hover:text-deep">Wrong email? Log out</button>
        </form>
      </div>
    </AuthShell>
  );
}
