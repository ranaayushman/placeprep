"use client";

import { useFormStatus } from "react-dom";

/**
 * A form's submit button that shows it is working: disabled with a spinner while the form's action
 * runs, so a slow server never looks like an ignored click (and a second click can't double-submit).
 */
export function SubmitButton({ children, className, disabled }: { children: React.ReactNode; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} aria-busy={pending} className={`${className ?? ""} inline-flex items-center justify-center gap-2`}>
      {pending && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}
