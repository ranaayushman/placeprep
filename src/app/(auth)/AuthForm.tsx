"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "./actions";
import { AuthShell, FIELD, LABEL, SUBMIT } from "./AuthShell";

const ERRORS: Record<string, string> = {
  google: "Google sign-in didn’t complete. Please try again.",
  google_off: "Google sign-in isn’t set up yet. Use email and password.",
  blocked: "This account has been suspended. Contact the PlacePrep team if you think this is a mistake.",
  rate: "Too many sign-ups from this network. Try again later.",
};

function GoogleButton() {
  // Plain link, not <Link>: this must be a full navigation to Google, never prefetched.
  return (
    <a
      href="/api/auth/google"
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-deep/15 bg-white px-4 py-3 text-sm font-semibold text-deep transition hover:border-brand hover:bg-brand-soft/40"
    >
      <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      Continue with Google
    </a>
  );
}

export function AuthForm({ mode, google, errorCode }: { mode: "login" | "register"; google: boolean; errorCode?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : register, undefined);
  const isRegister = mode === "register";
  const error = state?.error ?? (errorCode ? ERRORS[errorCode] : undefined);

  return (
    <AuthShell step={isRegister ? 1 : undefined}>
      <h1 className="text-3xl font-semibold tracking-tight">{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-muted">{isRegister ? "Takes 30 seconds. Then tell us where you're headed." : "Pick up where you left off."}</p>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {google && (
        <>
          <div className="mt-6">
            <GoogleButton />
          </div>
          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-deep/15" /> or with email <span className="h-px flex-1 bg-deep/15" />
          </div>
        </>
      )}

      <form action={action} className={`space-y-4 ${google ? "" : "mt-6"}`}>
        {isRegister && (
          <label className="block">
            <span className={LABEL}>Full name</span>
            <input name="name" required minLength={2} maxLength={60} className={FIELD} autoComplete="name" placeholder="As on your college ID" />
          </label>
        )}
        <label className="block">
          <span className={LABEL}>Email</span>
          <input name="email" type="email" required className={FIELD} autoComplete="email" placeholder="you@college.edu" />
        </label>
        <label className="block">
          <span className={LABEL}>Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={isRegister ? 8 : 1}
            className={FIELD}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder={isRegister ? "At least 8 characters" : ""}
          />
        </label>
        <button disabled={pending} className={SUBMIT}>
          {pending ? "Please wait…" : isRegister ? "Create account →" : "Log in →"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-deep underline decoration-brand/50 decoration-2 underline-offset-4">
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </AuthShell>
  );
}
