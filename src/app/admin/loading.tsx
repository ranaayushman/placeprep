/** Shown at once when switching admin pages; the header stays, so a slow load no longer looks like a frozen click. */
export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card h-24 bg-slate-50" />
        ))}
      </div>
      <div className="card h-64 bg-slate-50" />
    </div>
  );
}
