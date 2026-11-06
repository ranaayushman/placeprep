"use client";

import { useActionState, useState } from "react";
import { BRANCHES, COMPANY_SUGGESTIONS, DEGREES, passoutYears } from "@/lib/profile";
import { saveProfile, type AuthState } from "../actions";
import { AuthShell, FIELD, LABEL, SUBMIT } from "../AuthShell";

type Initial = { college: string | null; degree: string | null; branch: string | null; passoutYear: number | null; dreamCompany: string | null };

/** Big tap targets instead of a dropdown, for the short lists. */
function Chips({ name, options, value, onChange }: { name: string; options: readonly (string | number)[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const v = String(o);
        return (
          <label
            key={v}
            className={`cursor-pointer rounded-xl border px-3.5 py-2 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
              value === v ? "border-brand bg-brand-dark text-white" : "border-deep/15 bg-surface hover:border-brand"
            }`}
          >
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} required className="sr-only" />
            {v}
          </label>
        );
      })}
    </div>
  );
}

export function OnboardingForm({ firstName, initial }: { firstName: string; initial?: Initial }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(saveProfile, undefined);
  const [degree, setDegree] = useState(initial?.degree ?? "");
  const [year, setYear] = useState(initial?.passoutYear ? String(initial.passoutYear) : "");
  const [company, setCompany] = useState(initial?.dreamCompany ?? "");

  return (
    <AuthShell step={2}>
      <h1 className="text-3xl font-semibold tracking-tight">Nice to meet you, {firstName}.</h1>
      <p className="mt-2 text-muted">A few quick questions so your practice plan fits your drive. Takes under a minute.</p>

      {state?.error && (
        <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <form action={action} className="mt-8 space-y-6">
        <label className="block">
          <span className={LABEL}>College</span>
          <input name="college" required minLength={2} maxLength={120} defaultValue={initial?.college ?? ""} className={FIELD} placeholder="e.g. PES University, Bengaluru" autoComplete="organization" />
        </label>

        <fieldset>
          <legend className={LABEL}>Degree</legend>
          <Chips name="degree" options={DEGREES} value={degree} onChange={setDegree} />
        </fieldset>

        <label className="block">
          <span className={LABEL}>Branch / department</span>
          <select name="branch" required defaultValue={initial?.branch ?? ""} className={FIELD}>
            <option value="" disabled>Choose your branch</option>
            {BRANCHES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </label>

        <fieldset>
          <legend className={LABEL}>Year of passing out</legend>
          <Chips name="passoutYear" options={passoutYears()} value={year} onChange={setYear} />
        </fieldset>

        <div>
          <label htmlFor="dreamCompany" className={LABEL}>
            Dream company <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="dreamCompany" name="dreamCompany" maxLength={60} value={company} onChange={(e) => setCompany(e.target.value)} className={FIELD} placeholder="Where do you want to land?" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COMPANY_SUGGESTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCompany(c)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${company === c ? "border-brand bg-brand-soft text-brand-dark" : "border-deep/15 bg-surface hover:border-brand"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" name="marketing" className="mt-0.5" />
          <span>Email me placement tips, new mock tests and drive updates. Unsubscribe anytime.</span>
        </label>

        <button disabled={pending} className={SUBMIT}>{pending ? "Saving…" : "Take me to my dashboard →"}</button>
      </form>
    </AuthShell>
  );
}
