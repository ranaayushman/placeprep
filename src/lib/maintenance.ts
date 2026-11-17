import { createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, sessions, siteSettings, users } from "@/db";

const KEY = "maintenance";
const TTL_MS = 10_000;
let cached: { on: boolean; at: number } | null = null;

/** Admin switch, read by the middleware on every request: cached per server instance, so a toggle reaches every instance within 10 s. */
export async function maintenanceOn(): Promise<boolean> {
  if (process.env.MAINTENANCE_MODE === "1") return true;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.on;
  try {
    const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, KEY));
    cached = { on: row?.value === "on", at: Date.now() };
  } catch (e) {
    // Fail open: a missing migration or a DB blip must not close the site. MAINTENANCE_MODE=1 is the switch for a dead DB.
    console.error("maintenance flag read failed; site stays open", e);
    cached = { on: false, at: Date.now() };
  }
  return cached.on;
}

export async function setMaintenance(on: boolean, adminId: string) {
  const value = on ? "on" : "off";
  await db.insert(siteSettings).values({ key: KEY, value, updatedBy: adminId }).onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedBy: adminId, updatedAt: new Date() } });
  cached = { on, at: Date.now() };
}

export const maintenanceStatus = async () =>
  (await db.select({ value: siteSettings.value, updatedAt: siteSettings.updatedAt, by: users.name }).from(siteSettings).leftJoin(users, eq(users.id, siteSettings.updatedBy)).where(eq(siteSettings.key, KEY)))[0] ?? null;

/** Is this session cookie a signed-in, unblocked admin? Same checks as getCurrentUser, without next/headers. */
export async function isAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  // shortcut: one query per request from a signed-in non-admin while maintenance is on; cache by token if that load ever matters.
  const [row] = await db
    .select({ role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, createHash("sha256").update(token).digest("hex")), gt(sessions.expiresAt, new Date()), isNull(users.blockedAt)))
    .limit(1);
  return row?.role === "ADMIN";
}
