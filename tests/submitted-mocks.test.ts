import { beforeAll, expect, it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { attempts, db, users } from "@/db";
import { submittedMocks } from "@/lib/admin";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
});

it("lists submitted mocks newest first, filtered by time window and exam", async () => {
  const [u] = await db.insert(users).values({ email: `sm-${Math.random()}@example.com`, name: "Sub Mock", passwordHash: "x" }).returning();
  const DAY = 86_400_000;
  const mk = (daysAgo: number, exam: string, status: "SUBMITTED" | "IN_PROGRESS" = "SUBMITTED", mode: "MOCK" | "PRACTICE" = "MOCK") =>
    db.insert(attempts).values({ userId: u.id, mode, exam, title: `${exam} ${daysAgo}`, status, score: 5, maxScore: 10, submittedAt: new Date(Date.now() - daysAgo * DAY) }).returning();
  await mk(0.1, "infosys-se");
  await mk(3, "deloitte-nla");
  await mk(40, "infosys-se");
  await mk(0.2, "infosys-se", "IN_PROGRESS"); // not finished
  await mk(0.2, "infosys-se", "SUBMITTED", "PRACTICE"); // not a mock
  const mine = async (o: Parameters<typeof submittedMocks>[0]) => (await submittedMocks(o)).rows.filter((r) => r.userId === u.id).map((r) => r.title);
  expect(await mine({ window: "all" })).toEqual(["infosys-se 0.1", "deloitte-nla 3", "infosys-se 40"]);
  expect(await mine({ window: "24h" })).toEqual(["infosys-se 0.1"]);
  expect(await mine({ window: "30d" })).toEqual(["infosys-se 0.1", "deloitte-nla 3"]);
  expect(await mine({ window: "all", exam: "infosys-se" })).toEqual(["infosys-se 0.1", "infosys-se 40"]);
});
