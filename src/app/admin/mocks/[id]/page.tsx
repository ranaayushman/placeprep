import { SubmitButton } from "@/components/SubmitButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireStaff } from "@/lib/auth";
import { MAX_MOCK_SECTIONS, MOCK_SECTIONS, mockAccessList, mockExamById } from "@/lib/exam/exams";
import { SECTION_LABELS, type SectionId } from "@/lib/questions";
import { MockExamForm } from "../MockExamForm";
import { addAccessAction, deleteMockAction, publishMockAction, removeAccessAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function MockExamPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const me = await requireStaff();
  const { id } = await params;
  const { msg } = await searchParams;
  const m = await mockExamById(id);
  if (!m) notFound();
  const [author] = m.createdBy ? await db.select({ name: users.name }).from(users).where(eq(users.id, m.createdBy)) : [];
  const live = m.status === "PUBLISHED";
  const allowlist = m.restricted ? await mockAccessList(m.id) : [];
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/mocks" className="text-sm text-slate-500 hover:text-slate-900">← Mock exams</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{m.company} · {m.name}</h1>
          <p className="text-sm text-slate-500">{live ? "Live for students" : "Draft"} · created by {author?.name ?? "a deleted user"}</p>
        </div>
        {me.role === "ADMIN" && (
          <form action={publishMockAction}>
            <input type="hidden" name="id" value={m.id} />
            {!live && <input type="hidden" name="publish" value="on" />}
            <SubmitButton className={live ? "btn-secondary" : "btn-primary"}>{live ? "Unpublish" : "Publish for students"}</SubmitButton>
          </form>
        )}
      </div>
      {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}

      {live ? (
        <div className="card text-sm">
          <ol className="space-y-1">
            {m.pattern.map((s, i) => (
              <li key={i}>{i + 1}. {SECTION_LABELS[s.section as SectionId]}: {s.questions} {s.section === "writing" ? "essay" : "questions"} · {s.minutes} min</li>
            ))}
          </ol>
          {m.note && <p className="mt-3 text-slate-600">Note: {m.note}</p>}
          <p className="mt-3 text-xs text-slate-500">{me.role === "ADMIN" ? "Unpublish it to edit." : "Live mocks can't be edited. Ask an admin to unpublish it first."}</p>
        </div>
      ) : (
        <>
          <MockExamForm initial={m} sections={MOCK_SECTIONS.map((sid) => ({ id: sid, label: SECTION_LABELS[sid] }))} maxSections={MAX_MOCK_SECTIONS} />
          <form action={deleteMockAction}>
            <input type="hidden" name="id" value={m.id} />
            <SubmitButton className="text-sm text-red-700 hover:underline">Delete this draft</SubmitButton>
          </form>
        </>
      )}

      {m.restricted && (
        <div className="card space-y-3">
          <div>
            <h2 className="font-semibold">Allowlist</h2>
            <p className="text-sm text-slate-500">Only these emails can see or start this restricted mock. {me.role !== "ADMIN" && "Only admins can change it."}</p>
          </div>
          {me.role === "ADMIN" && (
            <form action={addAccessAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={m.id} />
              <label className="flex-1 text-sm">
                <span className="mb-1 block font-medium">Add email</span>
                <input name="email" type="email" required placeholder="student@example.com" className="input" />
              </label>
              <SubmitButton className="btn-primary">Add</SubmitButton>
            </form>
          )}
          {allowlist.length === 0 ? (
            <p className="text-sm text-slate-500">No one can take this mock yet. Add an email above.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {allowlist.map((email) => (
                <li key={email} className="flex items-center justify-between py-2">
                  <span className="tabular-nums">{email}</span>
                  {me.role === "ADMIN" && (
                    <form action={removeAccessAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="email" value={email} />
                      <SubmitButton className="text-xs text-red-700 hover:underline">Remove</SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
