"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, users } from "@/db";
import { createSession, destroySession, getCurrentUser, hashPassword, homeFor, isConfiguredAdmin, requireUser, verifyPassword } from "@/lib/auth";
import { profileSchema } from "@/lib/profile";
import { logEvent } from "@/lib/events";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { requestInfo } from "@/lib/request-info";
import { after } from "next/server";
import { addToBrevo } from "@/lib/brevo";
import { sendOtp, verifyOtp } from "@/lib/otp";

export type AuthState = { error?: string } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(1, "Enter your password").max(128),
});

// A fixed bcrypt hash, used to keep login timing the same whether or not the email exists.
const DUMMY_HASH = "$2b$12$gvCx4ORaQu4JZMUCHAoAaOtFRL4gz40CNIS0C/MHW0/U5m6PUkcPO";

// shortcut: email codes are off until Brevo activates transactional email; set EMAIL_OTP=on (Vercel + .env) to turn them on, and add "Brevo sends sign-up codes" to the privacy page.
const otpEnabled = () => process.env.EMAIL_OTP === "on";

export async function register(_: AuthState, form: FormData): Promise<AuthState> {
  const { ip } = await requestInfo();
  if (!rateLimit(`register:${ip}`, LIMITS.register.limit, LIMITS.register.windowMs).ok) {
    await logEvent("rate_limited", { meta: { action: "register" } });
    return { error: "Too many sign-ups from this network. Try again later." };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const [existing] = await db.select({ id: users.id, verified: users.emailVerifiedAt }).from(users).where(eq(users.email, email)).limit(1);
  if (existing?.verified) return { error: "An account with this email already exists" };
  // Nobody proved they own this email yet (e.g. a typo or someone squatting it), so a new sign-up replaces it.
  if (existing) await db.delete(users).where(eq(users.id, existing.id));

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password), role: isConfiguredAdmin(email) ? "ADMIN" : "STUDENT", ...(otpEnabled() ? { emailVerifiedAt: null } : {}) })
    .returning({ id: users.id });
  await createSession(user.id);
  await logEvent("register", { userId: user.id });
  if (!otpEnabled()) redirect("/onboarding");
  const sent = await sendOtp({ id: user.id, email, name }).catch((err) => {
    console.error("[otp] send failed:", err);
    return null;
  });
  redirect(sent ? "/verify-email" : "/verify-email?error=send");
}

export type VerifyState = { error?: string; info?: string } | undefined;

export async function verifyEmail(_: VerifyState, form: FormData): Promise<VerifyState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) redirect(homeFor(user));
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code from the email." };
  const result = await verifyOtp(user.id, code);
  if (result === "wrong") return { error: "That code isn't right. Check the latest email and try again." };
  if (result === "locked") return { error: "Too many wrong tries. Send a new code." };
  if (result === "expired") return { error: "This code has expired. Send a new code." };
  await logEvent("email_verified", { userId: user.id });
  redirect(homeFor({ ...user, emailVerifiedAt: new Date() }));
}

export async function resendCode(): Promise<VerifyState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) redirect(homeFor(user));
  try {
    const res = await sendOtp(user);
    if (!res.ok) return { error: `Please wait ${res.retryAfterSec >= 120 ? `${Math.ceil(res.retryAfterSec / 60)} min` : `${res.retryAfterSec} s`} before asking for another code.` };
  } catch (err) {
    console.error("[otp] resend failed:", err);
    return { error: "We couldn't send the email right now. Try again in a minute." };
  }
  return { info: `New code sent to ${user.email}.` };
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const { ip } = await requestInfo();
  // Limit per IP+email (stops guessing one account) and per IP (stops spraying many accounts).
  const byPair = rateLimit(`login:${ip}:${email}`, LIMITS.login.limit, LIMITS.login.windowMs);
  const byIp = rateLimit(`login-ip:${ip}`, LIMITS.login.limit * 5, LIMITS.login.windowMs);
  if (!byPair.ok || !byIp.ok) {
    await logEvent("rate_limited", { meta: { action: "login", email } });
    return { error: `Too many attempts. Try again in ${Math.ceil(Math.max(byPair.retryAfterSec, byIp.retryAfterSec) / 60)} min.` };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  // Same message for unknown email and wrong password, so emails can't be enumerated.
  if (!user || !valid) {
    await logEvent("login_failed", { userId: user?.id, meta: { email } });
    return { error: "Incorrect email or password. Signed up with Google? Use “Continue with Google”." };
  }
  if (user.blockedAt) {
    await logEvent("login_blocked", { userId: user.id });
    return { error: "This account has been suspended. Contact the PlacePrep team if you think this is a mistake." };
  }
  if (user.role !== "ADMIN" && isConfiguredAdmin(email)) {
    await db.update(users).set({ role: "ADMIN" }).where(eq(users.id, user.id));
    user.role = "ADMIN";
  }
  await createSession(user.id);
  await logEvent("login", { userId: user.id });
  redirect(homeFor(user));
}

export async function saveProfile(_: AuthState, form: FormData): Promise<AuthState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const optIn = form.get("marketing") === "on";
  await db.update(users).set({ ...parsed.data, onboardedAt: new Date(), marketingOptInAt: optIn ? new Date() : null }).where(eq(users.id, user.id));
  // After the response, so a slow Brevo call never delays onboarding.
  if (optIn) after(() => addToBrevo(user.email, user.name));
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function logout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await logEvent("logout", { userId: user.id });
  redirect("/login");
}
