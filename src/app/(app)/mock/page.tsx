import Link from "next/link";
import { redirect } from "next/navigation";
import { MAX_VIOLATIONS } from "@/lib/exam/pattern";
import { canTakeExam, isLegacyExam, isPaperExam, listExamsFor } from "@/lib/exam/exams";
import { GENC_DIFFICULTIES, getRun } from "@/lib/exam/runs";
import { requireUser } from "@/lib/auth";
import { SECTION_LABELS } from "@/lib/questions";
import { LevelBadge } from "@/components/LevelBadge";
import { inviteLink, isInviteLocked, REFERRALS_TO_UNLOCK, referralStatus } from "@/lib/referral";
import { InviteCard } from "./InviteCard";
import { LockIcon } from "@/components/LockIcon";
import { DesktopOnlyNotice } from "@/components/exam/DesktopOnlyNotice";

export default async function MockPage({ searchParams }: { searchParams: Promise<{ exam?: string; run?: string }> }) {
  const user = await requireUser();
  const EXAMS = await listExamsFor(user.email);
  const { exam: wanted, run: runId } = await searchParams;
  const exam = EXAMS.find((e) => e.id === wanted) ?? (wanted ? await canTakeExam(user.email, wanted) : undefined) ?? EXAMS[0];
  if (isLegacyExam(exam.id)) redirect("/genc"); // old bookmarks and links
  // One paper of a GenC drive: only reachable from that drive, and only while it's still to be taken.
  const paper = isPaperExam(exam.id);
  let level = exam.level;
  let note = exam.note;
  if (paper) {
    const run = runId ? await getRun(user.id, runId) : null;
    const entry = run?.papers.find((p) => p.def.examId === exam.id);
    if (!run || !entry) redirect("/genc");
    level = GENC_DIFFICULTIES[run.difficulty].level;
    note = GENC_DIFFICULTIES[run.difficulty].blurb;
    if (entry.attempt) redirect(entry.attempt.status === "IN_PROGRESS" ? `/attempt/${entry.attempt.id}` : `/genc/${run.id}`);
  }
  const referrals = await referralStatus(user.id);
  const isLocked = (id: string) => isInviteLocked(id, referrals);
  const hasWriting = exam.pattern.some((s) => s.section === "writing");
  const mcqMinutes = exam.pattern.filter((s) => s.section !== "writing").reduce((a, s) => a + s.minutes, 0);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        {paper && (
          <Link href={`/genc/${runId}`} className="mb-4 inline-block text-sm text-muted hover:text-deep">← Back to your GenC drive</Link>
        )}
        {!paper && EXAMS.length > 1 && (
          <nav className="mb-4 flex flex-wrap gap-2" aria-label="Choose an exam">
            {EXAMS.map((e) => (
              <Link
                key={e.id}
                href={`/mock?exam=${e.id}`}
                aria-current={e.id === exam.id ? "page" : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${e.id === exam.id ? "border-brand bg-brand-soft text-brand-dark" : "border-slate-200 bg-white text-slate-600 hover:border-brand"}`}
              >
                {isLocked(e.id) && <LockIcon className="mr-1 -mt-0.5" />}
                {e.short}
              </Link>
            ))}
          </nav>
        )}
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
          {exam.company} · {exam.name}
          <LevelBadge level={level} />
        </h1>
        <p className="text-slate-500">A complete mock in the reported pattern, with the real exam rules. Set aside about {mcqMinutes + (hasWriting ? 20 : 0)} minutes.</p>
        {note && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{note}</p>}
      </div>

      <div className="card">
        <h2 className="font-semibold">Sections</h2>
        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {exam.pattern.map((s) => (
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
          <li><b>New questions every attempt.</b> Each mock is a fresh set, and questions you&apos;ve already seen are skipped, so retaking it is never the same paper.</li>
          <li>Each section has its <b>own timer</b>. When it runs out, the section is submitted automatically.</li>
          <li>Once you submit a section you <b>cannot go back</b> to it. Within a section you can move freely.</li>
          <li><b>No negative marking</b> — attempt every question. Every section has its own cut-off.</li>
          <li>The test runs in <b>full screen</b>. Leaving full screen, switching tabs or windows counts as a warning. At {MAX_VIOLATIONS} warnings the test is submitted automatically.</li>
          <li>With camera proctoring on, times your face isn&apos;t visible, you look away, or another face appears are counted as <b>camera alerts</b> and shown on your result. They never end the test, and looking down at rough paper for a few seconds is fine.</li>
          <li>Copy, paste, right-click and developer tools are disabled. Keep rough paper and a pen ready — calculators are not allowed.</li>
          <li>Closing the tab does not pause the timer. If you leave the test for more than 3 minutes, it is submitted and scored with the answers you saved.</li>
        </ul>
      </div>

      {isLocked(exam.id) ? (
        <InviteCard link={await inviteLink(user.id)} have={referrals.have} need={REFERRALS_TO_UNLOCK[exam.id]} />
      ) : (
      <>
        {/* Phones and small tablets: same condition as useDesktopOnly(), in CSS so there is no flash */}
        <div className="hidden [@media(pointer:coarse)_and_(max-width:1023px)]:block"><DesktopOnlyNotice /></div>
        <div className="card flex flex-wrap items-center justify-between gap-4 [@media(pointer:coarse)_and_(max-width:1023px)]:hidden">
          <span className="text-sm text-slate-500">Ready? Complete the system check before starting.</span>
          <Link href={`/mock/system-check?exam=${exam.id}${paper ? `&run=${runId}` : ""}`} className="btn-primary px-6 py-3">
            Continue to system check
          </Link>
        </div>
      </>
      )}
    </div>
  );
}
