/** Starting or resuming a test can take a moment (questions are prepared on the server). */
export default function AttemptLoading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-100 text-slate-600" aria-busy="true">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" aria-hidden />
      <p className="text-sm">Preparing your test…</p>
    </div>
  );
}
