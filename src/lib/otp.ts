import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, emailOtps, users } from "@/db";
import { sendEmail } from "@/lib/brevo";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_SENDS_PER_HOUR = 5;
const HOUR = 60 * 60 * 1000;

// Salted with the user id, so the same code for two users never has the same hash.
const hashCode = (userId: string, code: string) => createHash("sha256").update(`${userId}:${code}`).digest("hex");

/**
 * Makes a new 6-digit code for the user, replacing any earlier one. Limits live in the database, so they
 * hold across server instances: one email a minute and 5 an hour, which stops using sign-up to spam someone.
 */
export async function createOtp(userId: string, now = Date.now()): Promise<{ ok: true; code: string } | { ok: false; retryAfterSec: number }> {
  const [prev] = await db.select().from(emailOtps).where(eq(emailOtps.userId, userId));
  const newWindow = !prev || now - prev.windowStart.getTime() >= HOUR;
  if (prev) {
    const cooldownLeft = prev.sentAt.getTime() + OTP_RESEND_COOLDOWN_MS - now;
    if (cooldownLeft > 0) return { ok: false, retryAfterSec: Math.ceil(cooldownLeft / 1000) };
    if (!newWindow && prev.sends >= OTP_MAX_SENDS_PER_HOUR) return { ok: false, retryAfterSec: Math.ceil((prev.windowStart.getTime() + HOUR - now) / 1000) };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const row = {
    codeHash: hashCode(userId, code),
    expiresAt: new Date(now + OTP_TTL_MS),
    attempts: 0,
    sentAt: new Date(now),
    sends: newWindow ? 1 : prev!.sends + 1,
    windowStart: newWindow ? new Date(now) : prev!.windowStart,
  };
  await db.insert(emailOtps).values({ userId, ...row }).onConflictDoUpdate({ target: emailOtps.userId, set: row });
  return { ok: true, code };
}

/** Creates a code and emails it. Without Brevo (local dev) the code is printed to the server console instead. */
export async function sendOtp(user: { id: string; email: string; name: string }) {
  const res = await createOtp(user.id);
  if (!res.ok) return res;
  if (!process.env.BREVO_API_KEY) {
    if (process.env.NODE_ENV === "production") throw new Error("BREVO_API_KEY is not set, so sign-up codes can't be emailed.");
    console.info(`[otp] code for ${user.email}: ${res.code}`);
    return { ok: true as const };
  }
  await sendEmail(
    { email: user.email, name: user.name },
    `${res.code} is your PlacePrep code`,
    `<html><body style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1e293b">
      <p>Hi ${user.name.split(" ")[0].replace(/[<>&"']/g, "")},</p>
      <p>Your PlacePrep verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${res.code}</p>
      <p>It expires in 10 minutes. If you didn't sign up for PlacePrep, ignore this email.</p>
    </body></html>`,
  );
  return { ok: true as const };
}

export type VerifyResult = "ok" | "wrong" | "expired" | "locked";

/** Checks a code. A wrong guess uses up one of the 5 attempts; the right one verifies the email. */
export async function verifyOtp(userId: string, code: string, now = Date.now()): Promise<VerifyResult> {
  const [row] = await db.select().from(emailOtps).where(eq(emailOtps.userId, userId));
  if (!row || row.expiresAt.getTime() < now) return "expired";
  if (row.attempts >= OTP_MAX_ATTEMPTS) return "locked";
  const a = Buffer.from(hashCode(userId, code.trim()));
  const b = Buffer.from(row.codeHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    // Incremented in SQL, so parallel guesses can't all read the same count.
    const [{ attempts }] = await db.update(emailOtps).set({ attempts: sql`${emailOtps.attempts} + 1` }).where(eq(emailOtps.userId, userId)).returning({ attempts: emailOtps.attempts });
    return attempts >= OTP_MAX_ATTEMPTS ? "locked" : "wrong";
  }
  await db.transaction(async (tx) => {
    await tx.update(users).set({ emailVerifiedAt: new Date(now) }).where(eq(users.id, userId));
    await tx.delete(emailOtps).where(eq(emailOtps.userId, userId));
  });
  return "ok";
}
