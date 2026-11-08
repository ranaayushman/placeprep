import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { communityQuestions, db, questionReports, submissionMatches, users } from "@/db";
import { COMMUNITY_SECTIONS, COMPANIES, DUPLICATE_LIKELY, DUPLICATE_POSSIBLE } from "@/lib/community/config";
import { normalize } from "@/lib/community/normalize";
import { COMMUNITY_PREFIX, isCommunityRef } from "@/lib/community/serve";
import { generate, SECTION_LABELS, TOPIC_BY_ID, topicsFor } from "@/lib/questions";
import { approveAction, duplicateAction, editApproveAction, rejectAction } from "../actions";

export const dynamic = "force-dynamic";

type Shown = { stem: string; code?: string | null; options: string[]; answer: number; label: string };

/** The original text of a matched question: regenerate bank refs, load community ones. */
async function matchedQuestions(refs: string[]): Promise<Map<string, Shown>> {
  const ids = refs.filter(isCommunityRef).map((r) => r.slice(COMMUNITY_PREFIX.length));
  const community = ids.length ? await db.select().from(communityQuestions).where(inArray(communityQuestions.id, ids)) : [];
  const out = new Map<string, Shown>();
  for (const c of community) out.set(`${COMMUNITY_PREFIX}${c.id}`, { stem: c.stem, code: c.code, options: c.options, answer: c.answerIndex, label: `Community · ${c.status.toLowerCase().replace("_", " ")}` });
  for (const ref of refs.filter((r) => !isCommunityRef(r))) {
    const q = generate(ref);
    out.set(ref, { stem: q.prompt, code: q.code, options: q.options, answer: q.answer, label: `Bank · ${TOPIC_BY_ID.get(ref.split(":")[0])?.label}` });
  }
  return out;
}

const FILLER = new Set("the a an of to in on at for by and or is are was were be it this that with as from".split(" "));

/** Highlights content words that also occur in the submission, so the overlap is visible at a glance. */
function Highlight({ text, words }: { text: string; words: Set<string> }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, i) => {
        const w = normalize(part);
        return w && !FILLER.has(w) && w.split(" ").every((x) => words.has(x)) ? <mark key={i} className="rounded bg-amber-200 px-0.5">{part}</mark> : <span key={i}>{part}</span>;
      })}
    </>
  );
}

function QuestionCard({ q, words, title }: { q: Shown; words?: Set<string>; title: React.ReactNode }) {
  const hl = (t: string) => (words ? <Highlight text={t} words={words} /> : t);
  return (
    <div className="card space-y-3">
      <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</div>
      <p className="whitespace-pre-line">{hl(q.stem)}</p>
      {q.code && <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-sm text-slate-100">{q.code}</pre>}
      <ol className="space-y-1 text-sm">
        {q.options.map((o, i) => (
          <li key={i} className={`rounded-lg border px-3 py-1.5 ${i === q.answer ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}>
            <b className="mr-2 text-slate-500">{"ABCD"[i]}</b>
            {hl(o)}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const me = await requireStaff();
  const { id } = await params;
  const { msg } = await searchParams;
  const [row] = await db.select({ q: communityQuestions, author: users.name, email: users.email }).from(communityQuestions).innerJoin(users, eq(users.id, communityQuestions.authorId)).where(eq(communityQuestions.id, id));
  if (!row) notFound();
  const { q } = row;
  const [matches, reports] = await Promise.all([
    db.select().from(submissionMatches).where(eq(submissionMatches.submissionId, id)).orderBy(desc(submissionMatches.score)),
    db.select({ r: questionReports, name: users.name }).from(questionReports).innerJoin(users, eq(users.id, questionReports.userId)).where(eq(questionReports.questionId, id)).orderBy(desc(questionReports.createdAt)),
  ]);
  const shown = await matchedQuestions(matches.map((m) => m.matchedRef));
  const words = new Set(normalize([q.stem, q.code ?? "", ...q.options].join(" ")).split(" "));
  const companyIsListed = (COMPANIES as readonly string[]).includes(q.company);

  return (
    <div className="space-y-6">
      <Link href="/admin/community" className="text-sm text-slate-500 hover:text-slate-900">← Queue</Link>
      {msg && <div className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">{msg}</div>}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Review question</h1>
        <p className="text-sm text-slate-500">
          {q.status.replace("_", " ").toLowerCase()} · by {row.author}{me.role === "ADMIN" ? ` (${row.email})` : ""} · {SECTION_LABELS[q.section as keyof typeof SECTION_LABELS]} · {TOPIC_BY_ID.get(q.topic)?.label} · {q.company}
          {q.year ? ` ${q.year}` : ""} · {q.sourceType.replaceAll("_", " ").toLowerCase()}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <QuestionCard q={{ stem: q.stem, code: q.code, options: q.options, answer: q.answerIndex, label: "" }} title="Submission" />
          <div className="card text-sm"><p className="font-semibold">Explanation</p><p className="mt-1 whitespace-pre-line text-slate-700">{q.explanation}</p></div>
        </div>
        <div className="space-y-4">
          {matches.length === 0 && <p className="card text-sm text-slate-500">No similar questions found (nothing scored 30% or more).</p>}
          {matches.map((m) => {
            const s = shown.get(m.matchedRef);
            const tone = m.score >= DUPLICATE_LIKELY ? "text-red-600" : m.score >= DUPLICATE_POSSIBLE ? "text-amber-600" : "text-slate-500";
            return s ? (
              <QuestionCard
                key={m.matchedRef}
                q={s}
                words={words}
                title={
                  <span className="flex flex-wrap justify-between gap-2">
                    <span>{s.label} · <code className="normal-case">{m.matchedRef}</code></span>
                    <span className={tone}>{Math.round(m.score * 100)}% · question {Math.round(m.stemScore * 100)}% · options {Math.round(m.optionsScore * 100)}%</span>
                  </span>
                }
              />
            ) : null;
          })}
        </div>
      </div>

      {reports.length > 0 && (
        <section className="card">
          <h2 className="font-semibold">Reports</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {reports.map(({ r, name }) => (
              <li key={r.id} className="py-2">
                <b>{r.reason.replace("_", " ").toLowerCase()}</b> · {name} · {r.status.toLowerCase()}
                {r.details && <p className="text-slate-600">{r.details}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <form action={approveAction} className="card space-y-2">
          <input type="hidden" name="id" value={q.id} />
          <h2 className="font-semibold">Approve</h2>
          <p className="text-sm text-slate-500">Publish as it is.</p>
          <button className="btn-primary">Approve and publish</button>
        </form>
        <form action={rejectAction} className="card space-y-2">
          <input type="hidden" name="id" value={q.id} />
          <h2 className="font-semibold">Reject</h2>
          <input name="reason" required minLength={3} maxLength={300} placeholder="Reason, shown to the uploader" className="input" />
          <button className="btn-danger">Reject</button>
        </form>
        <form action={duplicateAction} className="card space-y-2">
          <input type="hidden" name="id" value={q.id} />
          <h2 className="font-semibold">Mark duplicate</h2>
          <select name="ref" required defaultValue={matches[0]?.matchedRef ?? ""} className="input">
            <option value="" disabled>Choose the original</option>
            {matches.map((m) => <option key={m.matchedRef} value={m.matchedRef}>{m.matchedRef} ({Math.round(m.score * 100)}%)</option>)}
          </select>
          <button className="btn-secondary" disabled={!matches.length}>Reject as duplicate</button>
        </form>
      </section>

      <details className="card">
        <summary className="cursor-pointer font-semibold">Edit &amp; approve</summary>
        <form action={editApproveAction} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={q.id} />
          <input type="hidden" name="sourceType" value={q.sourceType} />
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="text-sm">Section
              <select name="section" defaultValue={q.section} className="input mt-1">{COMMUNITY_SECTIONS.map((s) => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}</select>
            </label>
            <label className="text-sm">Topic
              <select name="topic" defaultValue={q.topic} className="input mt-1">
                {COMMUNITY_SECTIONS.map((s) => <optgroup key={s} label={SECTION_LABELS[s]}>{topicsFor(s).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>)}
              </select>
            </label>
            <label className="text-sm">Company
              <select name="company" defaultValue={companyIsListed ? q.company : "Other"} className="input mt-1">{COMPANIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="text-sm">If other
              <input name="companyOther" defaultValue={companyIsListed ? "" : q.company} className="input mt-1" />
            </label>
          </div>
          <label className="block text-sm">Question<textarea name="stem" defaultValue={q.stem} rows={3} className="input mt-1" /></label>
          <label className="block text-sm">Code<textarea name="code" defaultValue={q.code ?? ""} rows={2} className="input mt-1 font-mono" /></label>
          {q.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <input type="radio" name="answer" value={i} defaultChecked={i === q.answerIndex} aria-label={`Option ${"ABCD"[i]} is correct`} />
              <b className="w-4">{"ABCD"[i]}</b>
              <input name={`option${i}`} defaultValue={o} aria-label={`Option ${"ABCD"[i]}`} className="input" />
            </div>
          ))}
          <label className="block text-sm">Explanation<textarea name="explanation" defaultValue={q.explanation} rows={3} className="input mt-1" /></label>
          <input type="hidden" name="year" value={q.year ?? ""} />
          <button className="btn-primary">Save and publish</button>
        </form>
      </details>
    </div>
  );
}
