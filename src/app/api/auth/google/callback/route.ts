import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { db, users } from "@/db";
import { createSession, homeFor, isConfiguredAdmin, revokeAllSessions } from "@/lib/auth";
import { logEvent } from "@/lib/events";
import { finishGoogleAuth, googleEnabled, OAUTH_COOKIE } from "@/lib/google";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { requestInfo } from "@/lib/request-info";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const jar = await cookies();
  const [state, verifier] = (jar.get(OAUTH_COOKIE)?.value ?? "").split(".");
  jar.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });

  // State must match the cookie we set (stops login-CSRF); user cancelling lands here too.
  const code = params.get("code");
  if (!googleEnabled() || !code || !state || params.get("state") !== state) redirect("/login?error=google");
  const profile = await finishGoogleAuth(code, verifier);
  if (!profile) redirect("/login?error=google");

  let [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.googleId, profile.sub), eq(users.email, profile.email)))
    .limit(1);

  if (user) {
    if (user.blockedAt) {
      await logEvent("login_blocked", { userId: user.id });
      redirect("/login?error=blocked");
    }
    // Same email as a password account: link it to this Google account. Anyone could have made that
    // account with this email (sign-up doesn't always prove the email), so the password and every
    // session are dropped: whoever set them can't get into the account the real owner now uses.
    const linking = !user.googleId;
    const patch = {
      ...(linking ? { googleId: profile.sub, passwordHash: null } : {}),
      ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
      ...(user.role !== "ADMIN" && isConfiguredAdmin(profile.email) ? { role: "ADMIN" as const } : {}),
    };
    if (linking && user.passwordHash) await revokeAllSessions(user.id);
    if (Object.keys(patch).length) [user] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
    await createSession(user.id);
    await logEvent("login", { userId: user.id, meta: { provider: "google" } });
    redirect(homeFor(user));
  }

  const { ip } = await requestInfo();
  if (!(await rateLimit(`register:${ip}`, LIMITS.register.limit, LIMITS.register.windowMs)).ok) {
    await logEvent("rate_limited", { meta: { action: "register" } });
    redirect("/login?error=rate");
  }
  [user] = await db
    .insert(users)
    .values({ name: profile.name, email: profile.email, googleId: profile.sub, role: isConfiguredAdmin(profile.email) ? "ADMIN" : "STUDENT" })
    .returning();
  await createSession(user.id);
  await logEvent("register", { userId: user.id, meta: { provider: "google" } });
  redirect(homeFor(user));
}
