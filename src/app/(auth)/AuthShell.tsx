import { Logo } from "@/components/Logo";

/** Two-column frame shared by login, sign-up and onboarding: brand panel left, form right. */
export function AuthShell({ step, children }: { step?: 1 | 2; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas text-deep lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-deep p-10 text-white lg:flex">
        <Logo onDark />
        <div>
          <p className="text-4xl leading-tight font-semibold text-balance">
            Every mock you take here is one less surprise on <span className="text-sun">drive day.</span>
          </p>
          <ul className="mt-8 space-y-3 text-white/75">
            <li>✓ Full-length proctored mocks with sectional timers</li>
            <li>✓ Unlimited practice with worked explanations</li>
            <li>✓ A plan built around your weakest topics</li>
          </ul>
        </div>
        <p className="text-xs text-white/50">Free for students. No card needed.</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Logo className="mb-8 lg:hidden" />
          {step && (
            <ol className="mb-6 flex items-center gap-3 text-xs" aria-label={`Step ${step} of 2`}>
              {["Account", "Your profile"].map((label, i) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${i + 1 < step ? "border-success bg-success text-white" : i + 1 === step ? "border-brand bg-brand-dark text-white" : "border-deep/20 text-muted"}`}
                  >
                    {i + 1 < step ? "✓" : i + 1}
                  </span>
                  <span className={i + 1 === step ? "font-semibold" : "text-muted"}>{label}</span>
                  {i === 0 && <span aria-hidden className="mx-1 h-px w-8 bg-deep/30" />}
                </li>
              ))}
            </ol>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export const FIELD =
  "w-full rounded-xl border border-deep/15 bg-surface px-3.5 py-3 text-sm text-deep placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none";
export const LABEL = "mb-1.5 block text-sm font-medium";
export const SUBMIT =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-3 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-deep disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";
