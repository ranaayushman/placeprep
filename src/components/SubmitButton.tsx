"use client";

import { useFormStatus } from "react-dom";

/**
 * A form's submit button that shows it is working: disabled with a spinner while the form's action
 * runs, so a slow server never looks like an ignored click (and a second click can't double-submit).
 */
export function SubmitButton({ children, className, disabled }: { children: React.ReactNode; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    // The caller's className is used as-is (rows on the dashboard are full-width flex buttons); adding
    // layout classes here would override theirs. Pending only dims the button and adds a spinner.
    <button type="submit" disabled={disabled || pending} aria-busy={pending} className={`${className ?? ""}${pending ? " cursor-wait opacity-70" : ""}`}>
      {pending && <span className="mr-2 inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]" aria-hidden />}
      {children}
    </button>
  );
}
