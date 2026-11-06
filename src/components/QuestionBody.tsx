import type { QuestionView } from "@/lib/questions/types";

/** Renders the stem of a question (prompt, code, table, grid). Works in server and client components. */
export function QuestionBody({ q, showPassage = true }: { q: QuestionView; showPassage?: boolean }) {
  return (
    <div className="space-y-4">
      {q.community && (
        <p className="inline-flex rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
          Community · Contributed by {q.community.author}
        </p>
      )}
      {showPassage && q.passage && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[15px] leading-relaxed text-slate-700">
          {q.passage}
        </div>
      )}
      <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed text-slate-900">{q.prompt}</p>
      {q.code && (
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm leading-6 text-slate-100">{q.code}</pre>
      )}
      {q.table && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                {q.table[0].map((h, i) => (
                  <th key={i} className="border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.table.slice(1).map((row, r) => (
                <tr key={r}>
                  {row.map((c, i) => (
                    <td key={i} className={`border border-slate-300 px-3 py-2 ${i === 0 ? "font-medium" : "tabular-nums"}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {q.grid && (
        <div className="flex flex-col items-center gap-1.5 py-2">
          {q.grid.map((row, r) => (
            <div key={r} className="flex gap-1.5">
              {row.map((cell, c) => (
                <div
                  key={c}
                  className={`flex h-12 w-14 items-center justify-center rounded-md border text-lg font-semibold tabular-nums ${
                    cell === null
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : typeof cell === "string"
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-300 bg-white text-slate-800"
                  }`}
                >
                  {cell === null ? "?" : cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];
