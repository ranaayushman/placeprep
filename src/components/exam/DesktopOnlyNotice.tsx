import Link from "next/link";

/** Shown instead of a mock test on phones and small tablets. `inProgress`: the student already started it elsewhere. */
export function DesktopOnlyNotice({ inProgress = false }: { inProgress?: boolean }) {
  return (
    <div className="card mx-auto max-w-lg space-y-3 text-center" role="status">
      <p className="text-3xl" aria-hidden>💻</p>
      <h2 className="text-lg font-semibold text-deep">Mock tests need a laptop or desktop</h2>
      <p className="text-sm text-muted">
        The real exam runs full screen with a keyboard and camera checks, so mock tests can&apos;t be taken on a phone or tablet.
      </p>
      {inProgress && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Your test is still open and its timer keeps running. Open this page on a computer to continue.
        </p>
      )}
      <p className="text-sm text-muted">Practice quizzes, code practice and your results all work on your phone.</p>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        <Link href="/practice" className="btn-primary">Practise on your phone</Link>
        <Link href="/dashboard" className="btn-secondary">Back to dashboard</Link>
      </div>
    </div>
  );
}
