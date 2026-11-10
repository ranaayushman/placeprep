import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { attemptQuestions, attempts, db, users } from "@/db";
import { fmtSec, paceOf, speedOf } from "@/lib/exam/speed";
import { TOPIC_BY_ID } from "@/lib/questions";

const TOPIC = "z-crypt";
const target = TOPIC_BY_ID.get(TOPIC)!.targetSec;
const q = (timeSpentMs: number, chosenIndex: number | null, answerIndex = 0) => ({ timeSpentMs, chosenIndex, answerIndex, topic: TOPIC });

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
});

describe("answer speed", () => {
  it("averages answered questions only, against the topic's target pace", () => {
    const s = speedOf([q(30_000, 1), q(60_000, 0), q(90_000, null), q(5_000, 0, -1), q(0, 2)])!;
    expect(s).toEqual({ avgSec: 45, targetSec: target, answered: 2 });
    expect(speedOf([q(90_000, null)])).toBeNull();
    expect(paceOf({ avgSec: target, targetSec: target, answered: 1 })).toBe("fast");
    expect(paceOf({ avgSec: target * 1.2, targetSec: target, answered: 1 })).toBe("steady");
    expect(paceOf({ avgSec: target * 2, targetSec: target, answered: 1 })).toBe("slow");
    expect(fmtSec(75)).toBe("1m 15s");
    expect(fmtSec(42.4)).toBe("42s");
  });

  it("shows per mock in history and on the admin leaderboard", async () => {
    const { mockHistory } = await import("@/lib/analytics");
    const { leaderboard } = await import("@/lib/admin");
    const [u] = await db.insert(users).values({ email: `spd-${Math.random()}@example.com`, name: `Speedy ${Math.random()}`, passwordHash: "x" }).returning();
    const [a] = await db.insert(attempts).values({ userId: u.id, mode: "MOCK", exam: "infosys-se", title: "m", status: "SUBMITTED", score: 1, maxScore: 3, submittedAt: new Date() }).returning();
    await db.insert(attemptQuestions).values(
      [20_000, 40_000, 0].map((t, i) => ({
        attemptId: a.id, sectionOrder: 0, order: i, section: "reasoning", topic: TOPIC, ref: `${TOPIC}:${i}`, payload: "{}",
        answerIndex: 0, explanation: "", chosenIndex: t ? 0 : null, timeSpentMs: t, isCorrect: t === 20_000,
      })),
    );
    const [h] = await mockHistory(u.id);
    expect(h.speed).toEqual({ avgSec: 30, targetSec: target, answered: 2 });
    expect(h.bySection.reasoning).toEqual({ correct: 1, total: 3 });
    const row = (await leaderboard()).find((r) => r.id === u.id)!;
    expect(row.mockSecPerQ).toBeCloseTo(30);
  });
});
