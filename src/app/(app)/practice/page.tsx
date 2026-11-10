import { SubmitButton } from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { getTopicStats } from "@/lib/analytics";
import { SECTION_LABELS, type SectionId } from "@/lib/questions";
import { pct } from "@/components/charts";
import { publishedCountsByTopic } from "@/lib/community/service";
import { startPractice } from "../start-actions";

const SECTIONS: SectionId[] = ["reasoning", "math", "verbal", "pseudocode", "puzzle", "technical"];

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const { error } = await searchParams;
  const [stats, community] = await Promise.all([getTopicStats(user.id), publishedCountsByTopic()]);

  return (
    <form action={startPractice} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Practice</h1>
          <p className="text-slate-500">
            Pick one or more topics. Most topics are generated fresh every time, so you won&apos;t run out of questions.
            You get the answer and explanation right after each question.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <label className="text-sm">
            Questions{" "}
            <select name="count" defaultValue="10" className="ml-1 rounded-md border border-slate-300 px-2 py-1">
              {[5, 10, 15, 20, 30].map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="timed" /> Timed (exam pace)
          </label>
          <SubmitButton className="btn-primary">Start practice</SubmitButton>
        </div>
      </div>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <fieldset key={section} className="card">
            <legend className="sr-only">{SECTION_LABELS[section]}</legend>
            <p className="mb-3 font-semibold">{SECTION_LABELS[section]}</p>
            <ul className="space-y-1">
              {stats
                .filter((t) => t.section === section)
                .sort((a, b) => b.weight - a.weight)
                .map((t) => (
                  <li key={t.id}>
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <span className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="topic" value={t.id} className="h-4 w-4" />
                        {t.label}
                        {t.weight >= 3 && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">FREQUENT</span>}
                      </span>
                      <span className={`text-xs tabular-nums ${t.attempted === 0 ? "text-slate-400" : t.mastery < 0.6 ? "text-amber-600" : "text-emerald-600"}`}>
                        {t.attempted === 0 ? "new" : `${pct(t.accuracy)} · ${t.attempted} done`}
                      </span>
                    </label>
                    {(community.get(t.id) ?? 0) > 0 && (
                      <label className="ml-8 flex cursor-pointer items-center gap-2 pb-1 text-xs text-slate-500">
                        <input type="checkbox" name="community" value={t.id} className="h-3.5 w-3.5" />
                        Include community questions ({community.get(t.id)})
                      </label>
                    )}
                  </li>
                ))}
            </ul>
          </fieldset>
        ))}
      </div>
    </form>
  );
}
