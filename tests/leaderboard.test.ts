import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { attempts, db, users } from "@/db";
import { leaderboard } from "@/lib/admin";

const tag = Math.random().toString(36).slice(2, 8);
async function student(name: string, mocks: [number, number, string?][], role: "STUDENT" | "ADMIN" = "STUDENT") {
  const [u] = await db.insert(users).values({ email: `lb-${name}-${tag}@example.com`, name: `${name} ${tag}`, passwordHash: "x", role }).returning();
  for (const [score, maxScore, exam = "infosys-se"] of mocks)
    await db.insert(attempts).values({ userId: u.id, mode: "MOCK", exam, title: "Mock", status: "SUBMITTED", score, maxScore, submittedAt: new Date() });
  return u.id;
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
});

describe("leaderboard", () => {
  it("ranks by average mock score, best breaks ties, ties share a rank, admins left out", async () => {
    const a = await student("A", [[80, 100], [60, 100]]); // avg 70, best 80
    const b = await student("B", [[70, 100], [70, 100]]); // avg 70, best 70
    const c = await student("C", [[90, 100]]); // avg 90
    const d = await student("D", [[70, 100], [70, 100]]); // same as B
    const e = await student("E", [[20, 100, "deloitte-nla"]]);
    const admin = await student("Adm", [[100, 100]], "ADMIN");
    const pending = await student("P", []);
    await db.insert(attempts).values({ userId: pending, mode: "MOCK", exam: "infosys-se", title: "Open", status: "IN_PROGRESS", score: 100, maxScore: 100 });

    const mine = (await leaderboard()).filter((r) => r.name.endsWith(tag));
    expect(mine.map((r) => [r.id, r.rank])).toEqual([[c, mine[0].rank], [a, mine[1].rank], [b, mine[2].rank], [d, mine[3].rank], [e, mine[4].rank]]);
    expect(mine[2].rank).toBe(mine[3].rank); // B and D tie
    expect(mine[1].rank! < mine[2].rank!).toBe(true); // A beats B on best mock
    expect(mine.find((r) => r.id === admin || r.id === pending)).toBeUndefined();
    expect(mine[1]).toMatchObject({ mocks: 2, avgPct: 0.7, bestPct: 0.8 });

    const infosys = (await leaderboard("infosys-se")).filter((r) => r.name.endsWith(tag));
    expect(infosys.map((r) => r.id)).not.toContain(e);
  });
});

describe("leaderboard by questions attempted", () => {
  it("ranks everyone by answered questions across mocks and practice, finished or not", async () => {
    const { attemptQuestions } = await import("@/db");
    const t = Math.random().toString(36).slice(2, 8);
    const mk = async (name: string, answered: number, mode: "MOCK" | "PRACTICE", status: "SUBMITTED" | "IN_PROGRESS" = "SUBMITTED") => {
      const [u] = await db.insert(users).values({ email: `att-${name}-${t}@example.com`, name: `${name} ${t}`, passwordHash: "x" }).returning();
      const [a] = await db.insert(attempts).values({ userId: u.id, mode, title: "x", status }).returning();
      await db.insert(attemptQuestions).values(
        Array.from({ length: answered + 2 }, (_, i) => ({
          attemptId: a.id, sectionOrder: 0, order: i, section: "math", topic: "m-percent", ref: `m-percent:${i}`, payload: "{}",
          answerIndex: 0, explanation: "", chosenIndex: i < answered ? (i % 2) : null, isCorrect: i < answered ? i % 2 === 0 : null,
        })),
      );
      return u.id;
    };
    const many = await mk("Many", 30, "PRACTICE", "IN_PROGRESS"); // unfinished practice still counts
    const mid = await mk("Mid", 12, "MOCK");
    const few = await mk("Few", 4, "PRACTICE");
    const mine = (await leaderboard(undefined, "attempted")).filter((r) => r.name.endsWith(t));
    expect(mine.map((r) => r.id)).toEqual([many, mid, few]);
    expect(mine.map((r) => r.totalAnswered)).toEqual([30, 12, 4]);
    expect(mine[0].rank! < mine[1].rank! && mine[1].rank! < mine[2].rank!).toBe(true);
    expect(mine[0].totalAcc).toBeCloseTo(0.5);
  });
});
