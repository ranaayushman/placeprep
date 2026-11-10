/** Shown at once when moving between student pages; the header stays, so a click never looks ignored. */
export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card h-28 bg-slate-50" />
        ))}
      </div>
      <div className="card h-72 bg-slate-50" />
    </div>
  );
}
