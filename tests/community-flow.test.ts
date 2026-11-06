import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { and, eq } from "drizzle-orm";
import { adminActions, attempts, attemptQuestions, communityQuestions, db, questionFingerprints, submissionMatches, users } from "@/db";
import { MAX_SUBMISSIONS_PER_DAY, MIN_ANSWERED_TO_UPLOAD } from "@/lib/community/config";
import { seedBankFingerprints } from "@/lib/community/fingerprints";
import { normOptions, normStem } from "@/lib/community/normalize";
import { approve, CommunityError, editAndApprove, markDuplicate, reject, report, submitQuestion, suspiciousAnswerKeys } from "@/lib/community/service";
import { createPractice, getExamState, saveAnswer } from "@/lib/exam/service";
import { generate } from "@/lib/questions";

const mkUser = async (name: string, role: "STUDENT" | "ADMIN" = "STUDENT") =>
  (await db.insert(users).values({ email: `${name.replace(/\s/g, "").toLowerCase()}-${Math.random()}@example.com`, name, passwordHash: "x", role }).returning())[0].id;

/** Answers `n` practice questions so the user passes the upload eligibility check. */
async function practise(userId: string, n: number) {
  const id = await createPractice(userId, { topicIds: ["m-percent"], count: n, timed: false });
  const s = await getExamState(id, userId);
  if (s.status !== "IN_PROGRESS") throw new Error();
  for (const q of s.current.questions) await saveAnswer(id, userId, { questionId: q.id, chosenIndex: 0 });
}

const novel = (n = 0) => ({
  section: "technical" as const,
  topic: "t-security",
  company: "Deloitte" as const,
  year: 2025,
  stem: `Which attack tricks a user into clicking a hidden button layered under a harmless page? (variant ${n})`,
  options: ["Clickjacking", "Phishing", "Smurf attack", "Session fixation"],
  answerIndex: 0,
  explanation: "Clickjacking overlays an invisible frame so the click lands on the attacker's button.",
  sourceType: "MEMORY_BASED_PYQ" as const,
  ownWords: true as const,
});

let author: string, admin: string;
beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  await seedBankFingerprints();
  author = await mkUser("Contri Butor");
  admin = await mkUser("Admin Person", "ADMIN");
  await practise(author, MIN_ANSWERED_TO_UPLOAD);
});

describe("eligibility and daily limit", () => {
  it(`needs ${MIN_ANSWERED_TO_UPLOAD} answered questions first`, async () => {
    const newbie = await mkUser("New Bie");
    await expect(submitQuestion(newbie, novel())).rejects.toThrow(/more practice questions/);
  });

  it(`allows ${MAX_SUBMISSIONS_PER_DAY} uploads a day, counted in the database`, async () => {
    const busy = await mkUser("Busy Bee");
    await practise(busy, MIN_ANSWERED_TO_UPLOAD);
    const base = { authorId: busy, section: "technical", topic: "t-security", company: "Infosys", stem: "x", options: ["a", "b", "c", "d"], answerIndex: 0, explanation: "x", sourceType: "ORIGINAL" as const, status: "REJECTED" as const, normStem: "x", normOptions: "x" };
    await db.insert(communityQuestions).values(Array.from({ length: MAX_SUBMISSIONS_PER_DAY }, () => base));
    await expect(submitQuestion(busy, novel(99))).rejects.toThrow(/a day/);
  });
});

describe("submit → similarity check", () => {
  it("an exact copy of a verbal bank question lands in flagged duplicates with score ≥ 0.85", async () => {
    const q = generate("v-correction:0");
    const row = await submitQuestion(author, { ...novel(), section: "verbal", topic: "v-correction", stem: q.prompt, options: q.options, answerIndex: q.answer });
    expect(row.status).toBe("FLAGGED_DUPLICATE");
    expect(row.bestMatchScore).toBeGreaterThanOrEqual(0.85);
    const matches = await db.select().from(submissionMatches).where(eq(submissionMatches.submissionId, row.id));
    expect(matches.map((m) => m.matchedRef)).toContain("v-correction:0");
  });

  it("a new question goes to pending review, gets a fingerprint, and a later copy of it is flagged", async () => {
    const first = await submitQuestion(author, novel(1));
    expect(first.status).toBe("PENDING_REVIEW");
    expect(await db.select().from(questionFingerprints).where(eq(questionFingerprints.ref, `community:${first.id}`))).toHaveLength(1);
    const copy = await submitQuestion(author, { ...novel(1), options: [...novel().options].reverse(), answerIndex: 3 });
    expect(copy.status).toBe("FLAGGED_DUPLICATE");
  });
});

describe("admin decisions", () => {
  it("approve publishes; approving again is refused", async () => {
    const q = await submitQuestion(author, novel(2));
    expect((await approve(admin, q.id)).status).toBe("PUBLISHED");
    await expect(approve(admin, q.id)).rejects.toThrow(CommunityError);
  });

  it("edit & approve rewrites the question and its fingerprint", async () => {
    const q = await submitQuestion(author, novel(3));
    const edited = await editAndApprove(admin, q.id, { ...novel(3), stem: "Which attack hides a malicious button under a decoy web page?" });
    expect(edited.status).toBe("PUBLISHED");
    const [fp] = await db.select().from(questionFingerprints).where(eq(questionFingerprints.ref, `community:${q.id}`));
    expect(fp.normStem).toBe(normStem("Which attack hides a malicious button under a decoy web page?"));
  });

  it("reject stores the reason for the uploader and removes the fingerprint", async () => {
    const q = await submitQuestion(author, novel(4));
    const r = await reject(admin, q.id, "Two options are correct.");
    expect([r.status, r.rejectionReason]).toEqual(["REJECTED", "Two options are correct."]);
    expect(await db.select().from(questionFingerprints).where(eq(questionFingerprints.ref, `community:${q.id}`))).toHaveLength(0);
  });

  it("mark duplicate links the original and tells the uploader", async () => {
    const q = await submitQuestion(author, novel(5));
    await expect(markDuplicate(admin, q.id, "no-such:1")).rejects.toThrow(/existing question/);
    const r = await markDuplicate(admin, q.id, "t-security:0");
    expect([r.status, r.duplicateOfRef]).toEqual(["REJECTED", "t-security:0"]);
    expect(r.rejectionReason).toMatch(/already have/);
  });

  it("every decision is written to the admin audit log", async () => {
    const rows = await db.select().from(adminActions).where(and(eq(adminActions.adminId, admin)));
    expect(rows.map((r) => r.action).sort()).toEqual(["community_approve", "community_duplicate", "community_edit_approve", "community_reject"]);
  });
});

describe("publish → practice → monitor", () => {
  let published: string;
  beforeAll(async () => {
    const q = await submitQuestion(author, { ...novel(6), topic: "t-cloud", stem: "Which cloud model gives you a ready-made database you never patch yourself?", options: ["DBaaS", "Bare metal", "Colocation", "On-premise"] });
    published = (await approve(admin, q.id)).id;
  });

  it("appears in practice when the topic opts in, with the contributor's short name, and the snapshot survives later edits", async () => {
    const student = await mkUser("Pra Ctice");
    const attempt = await createPractice(student, { topicIds: ["t-cloud"], count: 2, timed: false, communityTopics: ["t-cloud"] });
    const [row] = await db.select().from(attemptQuestions).where(and(eq(attemptQuestions.attemptId, attempt), eq(attemptQuestions.ref, `community:${published}`)));
    expect(row).toBeDefined();
    expect(JSON.parse(row.payload).community).toEqual({ id: published, author: "Contri B." });
    expect(JSON.parse(row.payload)).not.toHaveProperty("answer");

    await editAndApprove(admin, published, { ...novel(6), topic: "t-cloud", stem: "Edited later: which model gives you a managed database?", options: ["DBaaS", "Bare metal", "Colocation", "On-premise"] });
    const [after] = await db.select().from(attemptQuestions).where(eq(attemptQuestions.id, row.id));
    expect(after.payload).toBe(row.payload);
  });

  it("is left out when the topic does not opt in", async () => {
    const student = await mkUser("Opt Out");
    const attempt = await createPractice(student, { topicIds: ["t-cloud"], count: 4, timed: false });
    const rows = await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, attempt));
    expect(rows.some((r) => r.ref.startsWith("community:"))).toBe(false);
  });

  it("3 reports hide it from practice (NEEDS_REVIEW)", async () => {
    for (const n of ["R One", "R Two", "R Three"]) await report(await mkUser(n), published, "WRONG_ANSWER");
    const [q] = await db.select().from(communityQuestions).where(eq(communityQuestions.id, published));
    expect(q.status).toBe("NEEDS_REVIEW");
    const student = await mkUser("After Reports");
    const attempt = await createPractice(student, { topicIds: ["t-cloud"], count: 4, timed: false, communityTopics: ["t-cloud"] });
    const rows = await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, attempt));
    expect(rows.some((r) => r.ref === `community:${published}`)).toBe(false);
  });

  it("flags a likely wrong answer key from answer statistics", async () => {
    const q = await submitQuestion(author, { ...novel(8), topic: "t-dbms", stem: "Which SQL keyword sorts the rows of a result set?", options: ["GROUP BY", "ORDER BY", "SORT", "ARRANGE"], answerIndex: 0 });
    await approve(admin, q.id);
    // 20 answers: 15 pick option 1 (the real answer), the key says 0.
    const [a] = await db.insert(attempts).values({ userId: author, mode: "PRACTICE", title: "stats", status: "SUBMITTED" }).returning();
    await db.insert(attemptQuestions).values(
      Array.from({ length: 20 }, (_, i) => ({
        attemptId: a.id, sectionOrder: 0, order: i, section: "technical", topic: "t-dbms", ref: `community:${q.id}`,
        payload: "{}", answerIndex: 0, explanation: "", chosenIndex: i < 15 ? 1 : 0, answeredAt: new Date(),
      })),
    );
    const hit = (await suspiciousAnswerKeys()).find((r) => r.id === q.id);
    expect(hit).toMatchObject({ answers: 20, top_wrong: 1 });
    expect(hit!.accuracy).toBeCloseTo(0.25);
    expect(hit!.topWrongShare).toBeCloseTo(0.75);
  });

  it("reporting twice counts once", async () => {
    const q = await submitQuestion(author, { ...novel(7), topic: "t-os", stem: "Which state is a process in while it waits for disk I/O to finish?", options: ["Blocked", "Running", "Ready", "Terminated"] });
    await approve(admin, q.id);
    const u = await mkUser("Twice Reporter");
    await report(u, q.id, "UNCLEAR");
    expect((await report(u, q.id, "UNCLEAR")).open).toBe(1);
  });
});

it("normalised option fingerprint ignores option order", () => {
  expect(normOptions(["b", "a", "d", "c"])).toBe(normOptions(["a", "b", "c", "d"]));
});
