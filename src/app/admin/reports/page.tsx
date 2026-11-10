import { requireStaff } from "@/lib/auth";
import { openBankReports, openReportsByTopic } from "@/lib/bank-reports";
import { OPTION_LETTERS, QuestionBody } from "@/components/QuestionBody";
import { TOPIC_BY_ID } from "@/lib/questions";
import { ago } from "@/components/admin/when";
import { closeReportsAction } from "./actions";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = { WRONG_ANSWER: "wrong answer", UNCLEAR: "unclear", OTHER: "other" };

export default async function BankReportsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requireStaff();
  const { msg } = await searchParams;
  const [groups, topics] = await Promise.all([openBankReports(), openReportsByTopic()]);
  const label = (t: string) => TOPIC_BY_ID.get(t)?.label ?? t;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Question reports</h1>
        <p className="text-sm text-slate-500">
          Students reporting built-in questions after seeing the answer. Most questions are generated, so a real bug usually means fixing the topic&apos;s generator in code, then marking it fixed here.
          Community questions are reported under Community.
        </p>
      </div>
      {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}

      {topics.length > 0 && (
        <section className="card">
          <h2 className="font-semibold">Topics with open reports</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {topics.map((t) => (
              <li key={t.topic} className="rounded-lg bg-slate-100 px-3 py-1.5">
                {label(t.topic)} · <b>{t.open}</b> report{t.open === 1 ? "" : "s"} on {t.questions} question{t.questions === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.length === 0 ? (
        <p className="card text-sm text-slate-500">No open reports.</p>
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => (
            <li key={g.ref} className="card space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-slate-500">
                <span>
                  <b className="text-slate-800">{g.open} report{g.open === 1 ? "" : "s"}</b> ·{" "}
                  {Object.entries(g.reasons).filter(([, n]) => n).map(([r, n]) => `${n} ${REASON_LABELS[r]}`).join(", ")} · {label(g.topic)} · <code>{g.ref}</code>
                </span>
                <span>last {ago(g.lastAt)}</span>
              </div>
              {g.question ? (
                <>
                  <QuestionBody q={g.question} />
                  <ul className="space-y-1 text-sm">
                    {g.question.options.map((o, i) => (
                      <li key={i} className={`rounded-md border px-3 py-1.5 ${i === g.question!.answer ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}>
                        <b className="mr-2">{OPTION_LETTERS[i]}.</b>{o}
                        {i === g.question!.answer && <span className="ml-2 text-xs font-semibold text-emerald-700">marked correct</span>}
                      </li>
                    ))}
                  </ul>
                  <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700"><b>Explanation: </b>{g.question.explanation}</p>
                </>
              ) : (
                <p className="text-sm text-slate-500">This topic no longer exists, so the question can&apos;t be shown.</p>
              )}
              {g.details.length > 0 && (
                <div className="text-sm">
                  <p className="text-xs font-semibold text-slate-500">What students wrote</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">{g.details.map((d, i) => <li key={i} className="whitespace-pre-wrap">{d}</li>)}</ul>
                </div>
              )}
              <div className="flex gap-2">
                {(["RESOLVED", "DISMISSED"] as const).map((s) => (
                  <form key={s} action={closeReportsAction}>
                    <input type="hidden" name="ref" value={g.ref} />
                    <input type="hidden" name="status" value={s} />
                    <button className={s === "RESOLVED" ? "btn-primary" : "btn-secondary"}>{s === "RESOLVED" ? "Fixed" : "Not a problem"}</button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
