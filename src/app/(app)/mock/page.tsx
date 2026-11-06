import { INFOSYS_SE_PATTERN, MAX_VIOLATIONS } from "@/lib/exam/pattern";
import { SECTION_LABELS } from "@/lib/questions";
import { startMock } from "../start-actions";
import { SystemCheck } from "./SystemCheck";

export default function MockPage() {
  const mcqMinutes = INFOSYS_SE_PATTERN.filter((s) => s.section !== "writing").reduce((a, s) => a + s.minutes, 0);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Full mock test</h1>
        <p className="text-slate-500">A complete Infosys SE-pattern paper with the real exam rules. Set aside about {mcqMinutes + 20} minutes.</p>
      </div>

      <div className="card">
        <h2 className="font-semibold">Sections</h2>
        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {INFOSYS_SE_PATTERN.map((s) => (
              <tr key={s.section}>
                <td className="py-2 font-medium">{SECTION_LABELS[s.section]}</td>
                <td className="py-2 tabular-nums text-slate-600">{s.questions} {s.section === "writing" ? "essay" : "questions"}</td>
                <td className="py-2 text-right tabular-nums text-slate-600">{s.minutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="font-semibold">Rules</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>Each section has its <b>own timer</b>. When it runs out, the section is submitted automatically.</li>
          <li>Once you submit a section you <b>cannot go back</b> to it. Within a section you can move freely.</li>
          <li><b>No negative marking</b> — attempt every question. Every section has its own cut-off.</li>
          <li>The test runs in <b>full screen</b>. Leaving full screen, switching tabs or windows counts as a warning. At {MAX_VIOLATIONS} warnings the test is submitted automatically.</li>
          <li>Copy, paste, right-click and developer tools are disabled. Keep rough paper and a pen ready — calculators are not allowed.</li>
          <li>Closing the tab does not pause the timer. You can resume from the dashboard.</li>
        </ul>
      </div>

      <SystemCheck />

      <form action={startMock} className="card flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="writing" defaultChecked /> Include the writing test (essay, 20 min)
        </label>
        <button className="btn-primary px-6 py-3">I understand — start the test</button>
      </form>
    </div>
  );
}
