"use client";

import { useActionState } from "react";
import { saveMockAction, type MockFormState } from "./actions";

type Initial = { id?: string; company?: string; name?: string; short?: string; note?: string | null; pattern?: { section: string; questions: number; minutes: number }[] };

/** Create or edit a mock pattern. Empty rows (no section chosen) are ignored. */
export function MockExamForm({ initial = {}, sections, maxSections }: { initial?: Initial; sections: { id: string; label: string }[]; maxSections: number }) {
  const [state, action, pending] = useActionState<MockFormState, FormData>(saveMockAction, undefined);
  const v = state?.values;
  const val = (k: string, fallback?: string | number | null) => v?.[k] ?? (fallback == null ? "" : String(fallback));
  return (
    // key: remount with the returned values after a failed save
    <form key={JSON.stringify(state)} action={action} className="card space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Company</span>
          <input name="company" required maxLength={40} defaultValue={val("company", initial.company)} placeholder="Cognizant" className="input" />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Exam name</span>
          <input name="name" required maxLength={80} defaultValue={val("name", initial.name)} placeholder="GenC online assessment" className="input" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Short name</span>
          <input name="short" required maxLength={30} defaultValue={val("short", initial.short)} placeholder="Cognizant GenC" className="input" />
          <span className="mt-1 block text-xs text-slate-500">Used in titles like “Cognizant GenC Mock #2”{initial.id ? "" : " and in the link"}.</span>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Note for students <span className="font-normal text-slate-500">(optional)</span></span>
          <input name="note" maxLength={300} defaultValue={val("note", initial.note)} placeholder="e.g. The real test also has a coding round, not simulated here." className="input" />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Sections, in order</legend>
        <p className="mt-1 text-xs text-slate-500">Each section has its own timer. Questions are drawn fresh from the bank on every attempt. Leave unused rows empty.</p>
        <div className="mt-3 space-y-2">
          {Array.from({ length: maxSections }, (_, i) => {
            const row = initial.pattern?.[i];
            return (
              <div key={i} className="grid grid-cols-[1.5rem_1fr_6rem_6rem] items-center gap-2 text-sm">
                <span className="text-slate-400 tabular-nums">{i + 1}.</span>
                <select name={`section${i}`} aria-label={`Section ${i + 1}`} defaultValue={val(`section${i}`, row?.section)} className="input">
                  <option value="">—</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <input name={`questions${i}`} type="number" min={1} max={60} aria-label={`Section ${i + 1} questions`} placeholder="Qs" defaultValue={val(`questions${i}`, row?.questions)} className="input" />
                <input name={`minutes${i}`} type="number" min={1} max={180} aria-label={`Section ${i + 1} minutes`} placeholder="Min" defaultValue={val(`minutes${i}`, row?.minutes)} className="input" />
              </div>
            );
          })}
        </div>
      </fieldset>
      <button disabled={pending} className="btn-primary">{pending ? "Saving…" : initial.id ? "Save draft" : "Create draft"}</button>
    </form>
  );
}
