import { Logo } from "./Logo";

/** Full-page frame for the 404 and error screens (the root layout has no header of its own). */
export function StatusPage({ code, title, children, actions }: { code: string; title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-deep">
      <header className="mx-auto w-full max-w-6xl px-4 py-4">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-24">
        <div className="max-w-md text-center">
          <p className="font-mono text-6xl font-bold text-brand">{code}</p>
          <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
          <div className="mt-2 text-muted">{children}</div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
        </div>
      </main>
    </div>
  );
}

export const PRIMARY = "rounded-xl bg-brand-dark px-5 py-2.5 font-semibold text-white hover:bg-deep";
export const SECONDARY = "rounded-xl border border-deep/15 bg-surface px-5 py-2.5 font-semibold text-deep hover:border-brand";
