import { beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, events, users } from "@/db";
import { indianStateOf } from "@/lib/geo/india";

describe("indianStateOf", () => {
  it("maps Indian IPv4, IPv4-mapped and IPv6 addresses to their state", async () => {
    expect(await indianStateOf("1.6.43.10")).toBe("Haryana");
    expect(await indianStateOf("1.6.68.200")).toBe("Karnataka");
    expect(await indianStateOf("::ffff:1.6.43.10")).toBe("Haryana");
    expect(await indianStateOf("2001:ac8:2::1")).toBe("Kerala");
    expect(await indianStateOf("2001:df0:2e5:ffff::")).toBe("Kerala");
  });
  it("returns null for foreign, private, missing and junk IPs", async () => {
    for (const ip of ["8.8.8.8", "10.0.0.1", "127.0.0.1", "::1", null, "not-an-ip"]) expect(await indianStateOf(ip)).toBeNull();
  });
});

describe("signupsByState", () => {
  beforeAll(() => migrate(db, { migrationsFolder: "drizzle" }));
  it("counts each student once, by their first logged IP", async () => {
    const { signupsByState } = await import("@/lib/admin");
    const before = (await signupsByState()).counts.get("Kerala") ?? 0;
    const [u] = await db.insert(users).values({ email: `geo-${Math.random()}@example.com`, name: "Geo", passwordHash: "x" }).returning();
    await db.insert(events).values([
      { userId: u.id, type: "register", ip: "2001:ac8:2::1", createdAt: new Date(Date.now() - 1000) },
      { userId: u.id, type: "login", ip: "1.6.43.10" },
    ]);
    const after = await signupsByState();
    expect(after.counts.get("Kerala")).toBe(before + 1);
  });
});
