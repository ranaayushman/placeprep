"use client";

import { useActionState, useState } from "react";
import { submitAction, type SubmitState } from "../actions";

type Section = { id: string; label: string; topics: { id: string; label: string }[] };

const SOURCE_LABELS = { ORIGINAL: "My own question", OTHER: "Other (still in my own words)" };

export function SubmitForm({ sections, companies }: { sections: Section[]; companies: readonly string[] }) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitAction, undefined);
  const v = state?.values ?? {};
  const [section, setSection] = useState(v.section ?? sections[0].id);
  const [company, setCompany] = useState(v.company ?? companies[0]);
  const topics = sections.find((s) => s.id === section)!.topics;

  return (
    // key: remount with the returned values after a failed submit
    <form key={JSON.stringify(state)} action={action} className="card space-y-5">
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Section</span>
          <select name="section" value={section} onChange={(e) => setSection(e.target.value)} className="input">
            {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Topic</span>
          <select name="topic" required defaultValue={topics.some((t) => t.id === v.topic) ? v.topic : ""} className="input">
            <option value="" disabled>Choose a topic</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Company</span>
          <select name="company" value={company} onChange={(e) => setCompany(e.target.value)} className="input">
            {companies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        {company === "Other" ? (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Company name</span>
            <input name="companyOther" required maxLength={60} defaultValue={v.companyOther} className="input" />
          </label>
        ) : (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Year <span className="font-normal text-slate-500">(optional)</span></span>
            <input name="year" type="number" min={2000} max={new Date().getFullYear() + 1} defaultValue={v.year} className="input" />
          </label>
        )}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Question</span>
        <textarea name="stem" required minLength={15} maxLength={2000} rows={4} defaultValue={v.stem} className="input" placeholder="The full question, including any statements or data." />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Code <span className="font-normal text-slate-500">(optional, for pseudocode or programming questions)</span></span>
        <textarea name="code" maxLength={4000} rows={3} defaultValue={v.code} className="input font-mono" spellCheck={false} />
      </label>

      <fieldset className="text-sm">
        <legend className="mb-1 font-medium">Options <span className="font-normal text-slate-500">(select the correct one)</span></legend>
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="answer" value={i} required defaultChecked={v.answer === String(i)} aria-label={`Option ${"ABCD"[i]} is correct`} className="h-4 w-4" />
              <span className="w-5 font-semibold text-slate-500">{"ABCD"[i]}</span>
              <input name={`option${i}`} required maxLength={300} defaultValue={v[`option${i}`]} aria-label={`Option ${"ABCD"[i]}`} className="input" />
            </div>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Explanation</span>
        <textarea name="explanation" required minLength={20} maxLength={2000} rows={3} defaultValue={v.explanation} className="input" placeholder="How do you get to the answer? Other students will read this." />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Where is it from?</span>
        <select name="sourceType" defaultValue={v.sourceType ?? "ORIGINAL"} className="input">
          {Object.entries(SOURCE_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="ownWords" required defaultChecked={v.ownWords === "on"} className="mt-0.5 h-4 w-4" />
        <span>I wrote this in my own words and did not copy it from a website, book or paid course.</span>
      </label>

      <button disabled={pending} className="btn-primary w-full sm:w-auto">{pending ? "Checking…" : "Submit for review"}</button>
    </form>
  );
}
