import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { attempts, db, feedback, users } from "@/db";
import { hasFeedback, saveFeedback } from "@/lib/feedback";

let userId: string;
let otherId: string;
const attempt = async (uid: string, status: "IN_PROGRESS" | "SUBMITTED") =>
  (await db.insert(attempts).values({ userId: uid, mode: "MOCK", status, title: "Infosys SE Mock #1" }).returning())[0].id;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  [{ id: userId }, { id: otherId }] = await db
    .insert(users)
    .values([{ email: `fb-${Math.random()}@example.com`, name: "Fb" }, { email: `fb2-${Math.random()}@example.com`, name: "Fb2" }])
    .returning();
});

describe("test feedback", () => {
  it("saves once per finished test; blank boxes become null", async () => {
    const id = await attempt(userId, "SUBMITTED");
    expect(await saveFeedback(userId, id, { product: "  Loved the timer  ", questions: "", suggestions: "More Deloitte" })).toEqual({ ok: true });
    expect(await saveFeedback(userId, id, { product: "second try" })).toEqual({ ok: true });
    const rows = await db.select().from(feedback).where(eq(feedback.attemptId, id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ product: "Loved the timer", questions: null, suggestions: "More Deloitte" });
    expect(await hasFeedback(id)).toBe(true);
  });

  it("rejects empty feedback, unfinished tests and someone else's test", async () => {
    const done = await attempt(userId, "SUBMITTED");
    const open = await attempt(userId, "IN_PROGRESS");
    expect(await saveFeedback(userId, done, { product: "  ", questions: "" })).toMatchObject({ ok: false });
    expect(await saveFeedback(userId, open, { product: "hi" })).toMatchObject({ ok: false });
    expect(await saveFeedback(otherId, done, { product: "hi" })).toMatchObject({ ok: false });
    expect(await saveFeedback(userId, done, { product: "x".repeat(2001) })).toMatchObject({ ok: false });
    expect(await hasFeedback(done)).toBe(false);
  });
});
