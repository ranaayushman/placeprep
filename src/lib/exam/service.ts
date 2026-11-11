import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { attemptQuestions, attempts, attemptSections, db, type Attempt, type AttemptSection } from "@/db";
import { generate, SECTION_LABELS, TOPIC_BY_ID, toView, topicsFor, type SectionId, type Topic } from "@/lib/questions";
import { RC_GROUP, RC_PASSAGES } from "@/lib/questions/verbal";
import { HARD_SHARE_BY_LEVEL, LEFT_AFTER_MS, MAX_VIOLATIONS, SUBMIT_GRACE_MS } from "./pattern";
import { getExam } from "./exams";
import { fingerprint, hardSlots, pickFresh, planTopics, shuffle, type History, type MocksAgo } from "./plan";
import { logEvent } from "@/lib/events";
import { COMMUNITY_PREFIX, freshCommunityIds, isCommunityRef, loadPublished } from "@/lib/community/serve";

export class ExamError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type Planned = { section: SectionId; ref: string };

async function loadHistory(userId: string): Promise<History> {
  const rows = await db
    .select({ attemptId: attempts.id, mode: attempts.mode, startedAt: attempts.startedAt, topic: attemptQuestions.topic, ref: attemptQuestions.ref, payload: attemptQuestions.payload })
    .from(attemptQuestions)
    .innerJoin(attempts, eq(attempts.id, attemptQuestions.attemptId))
    .where(eq(attempts.userId, userId));
  const seen = new Map<string, Set<number>>();
  const prints = new Map<string, Set<string>>();
  const mockStart = new Map<string, number>();
  for (const { attemptId, mode, startedAt, topic, ref, payload } of rows) {
    if (mode === "MOCK") mockStart.set(attemptId, startedAt.getTime());
    if (isCommunityRef(ref)) continue; // community questions have their own "unseen" query
    const t = TOPIC_BY_ID.get(topic);
    if (!t) continue;
    if (t.poolSize) {
      const set = seen.get(topic) ?? new Set<number>();
      set.add(Number(ref.split(":")[1]) % t.poolSize);
      seen.set(topic, set);
    }
    try {
      const set = prints.get(topic) ?? new Set<string>();
      set.add(fingerprint(JSON.parse(payload)));
      prints.set(topic, set);
    } catch {
      // A malformed old payload only means one less question is excluded.
    }
  }
  // Mocks newest first; a topic's "mocks ago" is the index of the newest mock that contained it.
  const order = new Map([...mockStart.entries()].sort((a, b) => b[1] - a[1]).map(([id], i) => [id, i]));
  const mocksAgo: MocksAgo = new Map();
  for (const { attemptId, topic } of rows) {
    const i = order.get(attemptId);
    if (i === undefined) continue;
    mocksAgo.set(topic, Math.min(mocksAgo.get(topic) ?? i, i));
  }
  return { seen, prints, mocksAgo };
}

async function insertAttempt(
  userId: string,
  mode: Attempt["mode"],
  title: string,
  exam: string | null,
  sections: { section: SectionId; durationSec: number; refs: string[] }[],
  cameraOff = false,
) {
  const attemptId = crypto.randomUUID();
  // Community refs come from the DB (generate() is synchronous); unpublished ones are dropped.
  const community = await loadPublished(sections.flatMap((s) => s.refs.filter(isCommunityRef).map((r) => r.slice(COMMUNITY_PREFIX.length))));
  sections = sections.map((s) => ({ ...s, refs: s.refs.filter((r) => !isCommunityRef(r) || community.has(r.slice(COMMUNITY_PREFIX.length))) }));
  if (sections.some((s) => !s.refs.length)) throw new ExamError("Those questions are no longer available");
  const qRows = sections.flatMap((s, sectionOrder) =>
    s.refs.map((ref, order) => {
      const c = isCommunityRef(ref) ? community.get(ref.slice(COMMUNITY_PREFIX.length))! : null;
      const q = c ? c.question : generate(ref);
      const topic = c ? c.topic : ref.split(":")[0];
      return {
        attemptId,
        sectionOrder,
        order,
        // Store each question's own section, so mixed practice sets are analysed correctly.
        section: TOPIC_BY_ID.get(topic)!.section,
        topic,
        ref,
        payload: JSON.stringify(toView(q)),
        answerIndex: q.answer,
        explanation: q.explanation,
      };
    }),
  );
  const reused = await db.transaction(async (tx) => {
    // One start at a time per student, so a double-tap on "Start" can't create two tests.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`);
    // Already open: a mock of the same exam, or the same practice set with nothing answered yet.
    const [open] = await tx
      .select({ id: attempts.id })
      .from(attempts)
      .where(
        and(
          eq(attempts.userId, userId),
          eq(attempts.mode, mode),
          eq(attempts.status, "IN_PROGRESS"),
          mode === "MOCK"
            ? eq(attempts.exam, exam!)
            : and(
                eq(attempts.title, title),
                sql`NOT EXISTS (SELECT 1 FROM attempt_questions q WHERE q.attempt_id = ${attempts.id} AND q.chosen_index IS NOT NULL)`,
              ),
        ),
      )
      .limit(1);
    if (open) return open.id;
    await tx.insert(attempts).values({ id: attemptId, userId, mode, title, exam, cameraOff });
    await tx.insert(attemptSections).values(sections.map((s, order) => ({ attemptId, section: s.section, order, durationSec: s.durationSec })));
    await tx.insert(attemptQuestions).values(qRows);
    return null;
  });
  if (reused) return reused;
  await logEvent(mode === "MOCK" ? "mock_started" : "practice_started", { userId, attemptId, meta: { title, questions: qRows.length } });
  return attemptId;
}

export async function createMock(userId: string, opts: { includeWriting: boolean; exam?: string; cameraOff?: boolean }) {
  const exam = await getExam(opts.exam ?? "infosys-se");
  if (!exam) throw new ExamError("Unknown exam");
  const history = await loadHistory(userId);
  const seen = history.seen;
  const [minHard, maxHard] = HARD_SHARE_BY_LEVEL[exam.level];
  // A fresh share per section, so mocks vary instead of always landing on the same split.
  const hardShare = () => minHard + Math.random() * (maxHard - minHard);
  const taken = new Set<string>();
  const plan = exam.pattern.filter((s) => opts.includeWriting || s.section !== "writing").map((spec) => {
    const refs: string[] = [];
    if (spec.section === "verbal") {
      // One reading passage with all its questions, like the real paper.
      const rc = TOPIC_BY_ID.get("v-rc")!;
      const used = seen.get("v-rc") ?? new Set<number>();
      const passages = Array.from({ length: RC_PASSAGES }, (_, p) => p);
      const freshP = passages.filter((p) => ![0, 1, 2, 3].some((k) => used.has(p * RC_GROUP + k)));
      const p = (freshP.length ? freshP : passages)[randomInt(0, (freshP.length ? freshP : passages).length)];
      for (let k = 0; k < RC_GROUP; k++) refs.push(`${rc.id}:${p * RC_GROUP + k + rc.poolSize! * randomInt(0, 10_000)}`);
      // The passage block stays together; the other verbal questions are mixed.
      const others = topicsFor("verbal").filter((t) => t.id !== "v-rc");
      const vt = planTopics(others, spec.questions - RC_GROUP, history.mocksAgo);
      const vh = hardSlots(vt, hardShare());
      vt.forEach((t, i) => refs.push(pickFresh(t, history, taken, vh[i])));
    } else {
      // Mixed topics, every topic covered (or rotated in when there are fewer slots than topics), no repeats.
      // Normal mock: 30–50% hard. Hard mock: 70–80% hard (where topics have a hard tier).
      const ts = planTopics(topicsFor(spec.section), spec.questions, history.mocksAgo);
      const hs = hardSlots(ts, hardShare());
      ts.forEach((t, i) => refs.push(pickFresh(t, history, taken, hs[i])));
    }
    return { section: spec.section, durationSec: spec.minutes * 60, refs };
  });
  const n = (await db.select({ id: attempts.id }).from(attempts).where(and(eq(attempts.userId, userId), eq(attempts.exam, exam.id)))).length;
  return insertAttempt(userId, "MOCK", `${exam.short} Mock #${n + 1}`, exam.id, plan, opts.cameraOff);
}

export async function createPractice(
  userId: string,
  opts: { topicIds: string[]; count: number; timed: boolean; title?: string; refs?: string[]; communityTopics?: string[] },
) {
  const history = await loadHistory(userId);
  const taken = new Set<string>();
  let planned: Planned[];
  if (opts.refs?.length) {
    // Retrying mistakes can include community refs; their topic lives in the DB.
    const community = await loadPublished(opts.refs.filter(isCommunityRef).map((r) => r.slice(COMMUNITY_PREFIX.length)));
    planned = opts.refs.flatMap((ref) => {
      const topic = isCommunityRef(ref) ? community.get(ref.slice(COMMUNITY_PREFIX.length))?.topic : ref.split(":")[0];
      return topic ? [{ section: TOPIC_BY_ID.get(topic)!.section, ref }] : [];
    });
    if (!planned.length) throw new ExamError("Those questions are no longer available");
  } else {
    const topics = opts.topicIds.map((id) => TOPIC_BY_ID.get(id)).filter((t): t is Topic => !!t && t.section !== "writing");
    if (!topics.length) throw new ExamError("Choose at least one topic");
    // Round-robin keeps every chosen topic covered; shuffling mixes them instead of A, B, C, A, B, C.
    const chosen = Array.from({ length: opts.count }, (_, i) => topics[i % topics.length]);
    const hard = hardSlots(chosen);
    planned = shuffle(chosen.map((t, i) => ({ section: t.section, ref: pickFresh(t, history, taken, hard[i]) })));
    // Opted-in topics: up to half of their slots become unseen published community questions.
    for (const t of topics.filter((tp) => opts.communityTopics?.includes(tp.id))) {
      const slots = planned.map((p, i) => (p.ref.startsWith(`${t.id}:`) ? i : -1)).filter((i) => i >= 0);
      const ids = await freshCommunityIds(userId, t.id, Math.ceil(slots.length / 2));
      ids.forEach((id, k) => (planned[slots[k]] = { section: t.section, ref: `${COMMUNITY_PREFIX}${id}` }));
    }
  }
  const targetSec = planned.reduce((s, p) => s + (TOPIC_BY_ID.get(p.ref.split(":")[0])?.targetSec ?? 90), 0);
  const title =
    opts.title ??
    (opts.topicIds.length === 1 ? `Practice: ${TOPIC_BY_ID.get(opts.topicIds[0])!.label}` : `Practice: ${opts.topicIds.length} topics`);
  return insertAttempt(userId, "PRACTICE", title, null, [
    { section: planned[0].section, durationSec: opts.timed ? Math.ceil(targetSec / 60) * 60 : 0, refs: planned.map((p) => p.ref) },
  ]);
}

async function loadOwned(attemptId: string, userId: string) {
  const [attempt] = await db.select().from(attempts).where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)));
  if (!attempt) throw new ExamError("Attempt not found", 404);
  return attempt;
}

const sectionEndsAt = (s: AttemptSection) =>
  s.durationSec > 0 && s.startedAt ? s.startedAt.getTime() + s.durationSec * 1000 : null;

/**
 * Grades every MCQ and closes the attempt in one transaction of set-based statements
 * (no per-question loop). Idempotent: the final UPDATE only applies while IN_PROGRESS.
 */
async function finalize(attemptId: string, autoSubmitted: boolean) {
  const now = new Date();
  const closed = await db.transaction(async (tx) => {
    await tx
      .update(attemptQuestions)
      .set({
        isCorrect: sql`CASE WHEN ${attemptQuestions.chosenIndex} IS NULL THEN NULL ELSE ${attemptQuestions.chosenIndex} = ${attemptQuestions.answerIndex} END`,
      })
      .where(and(eq(attemptQuestions.attemptId, attemptId), sql`${attemptQuestions.answerIndex} >= 0`));
    await tx.update(attemptSections).set({ endedAt: now }).where(and(eq(attemptSections.attemptId, attemptId), isNull(attemptSections.endedAt)));
    return tx
      .update(attempts)
      .set({
        status: "SUBMITTED",
        submittedAt: now,
        autoSubmitted,
        score: sql`(SELECT COUNT(*) FROM attempt_questions WHERE attempt_id = ${attemptId} AND answer_index >= 0 AND chosen_index = answer_index)`,
        maxScore: sql`(SELECT COUNT(*) FROM attempt_questions WHERE attempt_id = ${attemptId} AND answer_index >= 0)`,
      })
      .where(and(eq(attempts.id, attemptId), eq(attempts.status, "IN_PROGRESS")))
      .returning({ userId: attempts.userId, mode: attempts.mode, score: attempts.score, maxScore: attempts.maxScore });
  });
  const row = closed[0];
  if (row?.mode === "MOCK") {
    await logEvent("mock_submitted", { userId: row.userId, attemptId, withRequest: false, meta: { score: row.score, maxScore: row.maxScore, autoSubmitted } });
  }
}

/** True (and the test is scored) when the open test page stopped checking in: the student left. */
async function closeIfLeft(attempt: Attempt) {
  if (attempt.status !== "IN_PROGRESS" || Date.now() - (attempt.lastActiveAt ?? attempt.startedAt).getTime() <= LEFT_AFTER_MS) return false;
  await finalize(attempt.id, true);
  return true;
}
const touch = (attemptId: string) => db.update(attempts).set({ lastActiveAt: new Date() }).where(eq(attempts.id, attemptId));

/** Called by the open test page every HEARTBEAT_MS. */
export async function heartbeat(attemptId: string, userId: string) {
  const attempt = await loadOwned(attemptId, userId);
  if (attempt.status === "SUBMITTED" || (await closeIfLeft(attempt))) return { submitted: true };
  await touch(attemptId);
  return { submitted: false };
}

/** Scores every test this student left (see LEFT_AFTER_MS), so none stays open forever. */
export async function closeLeftAttempts(userId: string) {
  const open = await db.select().from(attempts).where(and(eq(attempts.userId, userId), eq(attempts.status, "IN_PROGRESS")));
  for (const a of open) await closeIfLeft(a);
}

/**
 * Moves past any timed sections whose clock has run out. The server is the only authority on
 * time: closing the tab or editing the page clock cannot extend a section.
 */
async function advanceExpired(attempt: Attempt, sections: AttemptSection[]) {
  let current = attempt.currentSection;
  const now = Date.now();
  while (current < sections.length) {
    const s = sections[current];
    const end = sectionEndsAt(s);
    if (end === null || now <= end + SUBMIT_GRACE_MS) break;
    await db.update(attemptSections).set({ endedAt: new Date(end) }).where(eq(attemptSections.id, s.id));
    current++;
  }
  if (current !== attempt.currentSection) {
    await db.update(attempts).set({ currentSection: current }).where(eq(attempts.id, attempt.id));
    if (current >= sections.length) await finalize(attempt.id, false);
  }
  return current;
}

export async function getExamState(attemptId: string, userId: string) {
  const attempt = await loadOwned(attemptId, userId);
  const sections = await db.select().from(attemptSections).where(eq(attemptSections.attemptId, attemptId)).orderBy(asc(attemptSections.order));
  if (attempt.status === "SUBMITTED" || (await closeIfLeft(attempt))) return { status: "SUBMITTED" as const };
  await touch(attempt.id);

  const current = await advanceExpired(attempt, sections);
  if (current >= sections.length) return { status: "SUBMITTED" as const };

  let section = sections[current];
  if (!section.startedAt) {
    // Conditional update: if two tabs load at once, only the first start time sticks.
    await db.update(attemptSections).set({ startedAt: new Date() }).where(and(eq(attemptSections.id, section.id), isNull(attemptSections.startedAt)));
    [section] = await db.select().from(attemptSections).where(eq(attemptSections.id, section.id));
  }
  const qs = await db
    .select()
    .from(attemptQuestions)
    .where(and(eq(attemptQuestions.attemptId, attemptId), eq(attemptQuestions.sectionOrder, current)))
    .orderBy(asc(attemptQuestions.order));

  const isPractice = attempt.mode === "PRACTICE";
  return {
    status: "IN_PROGRESS" as const,
    mode: attempt.mode,
    title: attempt.title,
    violations: attempt.violations,
    cameraOff: attempt.cameraOff,
    cameraAlerts: attempt.cameraAlerts,
    maxViolations: MAX_VIOLATIONS,
    serverNow: Date.now(),
    sections: sections.map((s) => ({ order: s.order, section: s.section, label: SECTION_LABELS[s.section as SectionId], durationSec: s.durationSec })),
    current: {
      order: current,
      section: section.section,
      label: SECTION_LABELS[section.section as SectionId],
      endsAt: sectionEndsAt(section),
      questions: qs.map((q) => ({
        id: q.id,
        view: JSON.parse(q.payload),
        topic: TOPIC_BY_ID.get(q.topic)?.label ?? q.topic,
        chosenIndex: q.chosenIndex,
        textAnswer: q.textAnswer,
        marked: q.marked,
        // Practice mode reveals feedback once a question has been answered; mocks never do.
        feedback: isPractice && q.chosenIndex != null ? { answerIndex: q.answerIndex, explanation: q.explanation } : null,
        // Practice only: the answer travels with the question so "right or wrong" shows the moment the
        // student clicks, without a round trip. A student could read it early, but that only inflates
        // their own practice score; grading still happens on the server. Mocks never send it.
        key: isPractice && q.answerIndex >= 0 ? { answerIndex: q.answerIndex, explanation: q.explanation } : null,
      })),
    },
  };
}
export type ExamState = Awaited<ReturnType<typeof getExamState>>;

async function activeSection(attempt: Attempt) {
  if (attempt.status !== "IN_PROGRESS") throw new ExamError("This test has already been submitted", 409);
  if (await closeIfLeft(attempt)) throw new ExamError("You left this test, so it was submitted", 409);
  const sections = await db.select().from(attemptSections).where(eq(attemptSections.attemptId, attempt.id)).orderBy(asc(attemptSections.order));
  const current = await advanceExpired(attempt, sections);
  if (current >= sections.length) throw new ExamError("Time is up for this test", 409);
  return { current, section: sections[current], total: sections.length };
}

export async function saveAnswer(
  attemptId: string,
  userId: string,
  input: { questionId: string; chosenIndex?: number | null; textAnswer?: string; marked?: boolean; timeDeltaMs?: number },
) {
  const attempt = await loadOwned(attemptId, userId);
  const { current } = await activeSection(attempt);
  const [q] = await db.select().from(attemptQuestions).where(and(eq(attemptQuestions.id, input.questionId), eq(attemptQuestions.attemptId, attemptId)));
  if (!q) throw new ExamError("Question not found", 404);
  if (q.sectionOrder !== current) throw new ExamError("This section is closed", 409);
  if (attempt.mode === "PRACTICE" && q.chosenIndex != null && input.chosenIndex !== undefined) {
    throw new ExamError("Already answered — practice answers are locked once checked", 409);
  }

  const options = (JSON.parse(q.payload) as { options: string[] }).options;
  // Cap per-request time so a tab left open overnight can't distort analytics. Incremented in
  // SQL (not read-modify-write), so two overlapping requests can't lose each other's time.
  const delta = Math.min(Math.max(0, Math.floor(input.timeDeltaMs ?? 0)), 10 * 60 * 1000);
  const patch: Partial<Record<keyof typeof attemptQuestions.$inferInsert, unknown>> = {
    timeSpentMs: sql`${attemptQuestions.timeSpentMs} + ${delta}`,
  };
  if (input.chosenIndex !== undefined) {
    if (input.chosenIndex !== null && (input.chosenIndex < 0 || input.chosenIndex >= options.length)) throw new ExamError("Invalid option");
    patch.chosenIndex = input.chosenIndex;
    patch.answeredAt = input.chosenIndex === null ? null : new Date();
  }
  if (input.textAnswer !== undefined) patch.textAnswer = input.textAnswer.slice(0, 10_000);
  if (input.marked !== undefined) patch.marked = input.marked;
  if (attempt.mode === "PRACTICE" && patch.chosenIndex != null) patch.isCorrect = patch.chosenIndex === q.answerIndex;

  await db.update(attemptQuestions).set(patch as typeof attemptQuestions.$inferInsert).where(eq(attemptQuestions.id, q.id));
  return attempt.mode === "PRACTICE" && patch.chosenIndex != null
    ? { feedback: { answerIndex: q.answerIndex, explanation: q.explanation } }
    : { feedback: null };
}

export async function submitSection(attemptId: string, userId: string, sectionOrder: number) {
  const attempt = await loadOwned(attemptId, userId);
  const { current, section, total } = await activeSection(attempt);
  if (sectionOrder !== current) throw new ExamError("Section already closed", 409);
  await db.update(attemptSections).set({ endedAt: new Date() }).where(eq(attemptSections.id, section.id));
  const next = current + 1;
  await db.update(attempts).set({ currentSection: next }).where(eq(attempts.id, attemptId));
  if (next >= total) await finalize(attemptId, false);
  return { finished: next >= total };
}

/** Used when an admin blocks a student: closes (and grades) any test they left open. */
export async function closeOpenAttempts(userId: string) {
  const open = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.status, "IN_PROGRESS")));
  for (const a of open) await finalize(a.id, true);
  return open.length;
}

export async function submitAll(attemptId: string, userId: string) {
  const attempt = await loadOwned(attemptId, userId);
  if (attempt.status === "SUBMITTED") return;
  await finalize(attemptId, false);
}

const VIOLATION_TYPES = ["tab-hidden", "window-blur", "fullscreen-exit", "copy-paste", "devtools-key", "no-face", "multiple-faces", "gaze-away"] as const;
export type ViolationType = (typeof VIOLATION_TYPES)[number];
export const isViolationType = (v: unknown): v is ViolationType => VIOLATION_TYPES.includes(v as ViolationType);

/**
 * Camera checks are a guess (looking down at rough paper can hide the face), so they are counted
 * as camera alerts for the student to see, never as warnings that auto-submit the test.
 */
const CAMERA_TYPES: readonly ViolationType[] = ["no-face", "multiple-faces", "gaze-away"];

export async function recordViolation(attemptId: string, userId: string, type: ViolationType) {
  const camera = CAMERA_TYPES.includes(type);
  // Atomic increment; the WHERE makes it a no-op for practice sets and finished tests.
  const [row] = await db
    .update(attempts)
    .set(camera ? { cameraAlerts: sql`${attempts.cameraAlerts} + 1` } : { violations: sql`${attempts.violations} + 1` })
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId), eq(attempts.mode, "MOCK"), eq(attempts.status, "IN_PROGRESS")))
    .returning({ violations: attempts.violations, cameraAlerts: attempts.cameraAlerts });
  if (!row) {
    const attempt = await loadOwned(attemptId, userId);
    return { violations: attempt.violations, cameraAlerts: attempt.cameraAlerts, autoSubmitted: false };
  }
  if (camera) {
    await logEvent("camera_alert", { userId, attemptId, meta: { type, count: row.cameraAlerts } });
    return { ...row, autoSubmitted: false };
  }
  await logEvent("violation", { userId, attemptId, meta: { type, count: row.violations } });
  if (row.violations >= MAX_VIOLATIONS) {
    await finalize(attemptId, true);
    return { ...row, autoSubmitted: true };
  }
  return { ...row, autoSubmitted: false };
}

export async function getResult(attemptId: string, userId: string) {
  const attempt = await loadOwned(attemptId, userId);
  const sections = await db.select().from(attemptSections).where(eq(attemptSections.attemptId, attemptId)).orderBy(asc(attemptSections.order));
  const qs = await db
    .select()
    .from(attemptQuestions)
    .where(eq(attemptQuestions.attemptId, attemptId))
    .orderBy(asc(attemptQuestions.sectionOrder), asc(attemptQuestions.order));
  return { attempt, sections, questions: qs };
}

export async function wrongRefs(userId: string, limit = 20) {
  const rows = await db
    .select({ ref: attemptQuestions.ref, topic: attemptQuestions.topic })
    .from(attemptQuestions)
    .innerJoin(attempts, eq(attempts.id, attemptQuestions.attemptId))
    .where(and(eq(attempts.userId, userId), eq(attempts.status, "SUBMITTED"), eq(attemptQuestions.isCorrect, false), inArray(attemptQuestions.section, ["reasoning", "math", "verbal", "pseudocode", "puzzle"])))
    .orderBy(asc(attemptQuestions.answeredAt));
  // Latest mistakes first, unique refs.
  return [...new Map(rows.reverse().map((r) => [r.ref, r])).values()].slice(0, limit);
}
