import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { db, users } from "@/db";
import { createSession, homeFor, isConfiguredAdmin } from "@/lib/auth";
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
    // Same verified email as an existing password account: link it to this Google account.
    // An unverified password account was never proven to belong to this person: Google proves the email
    // now, and the old password is dropped so whoever set it can't sign in to the linked account.
    const patch = {
      ...(user.googleId ? {} : { googleId: profile.sub }),
      ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date(), passwordHash: null }),
      ...(user.role !== "ADMIN" && isConfiguredAdmin(profile.email) ? { role: "ADMIN" as const } : {}),
    };
    if (Object.keys(patch).length) [user] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
    await createSession(user.id);
    await logEvent("login", { userId: user.id, meta: { provider: "google" } });
    redirect(homeFor(user));
  }

  const { ip } = await requestInfo();
  if (!rateLimit(`register:${ip}`, LIMITS.register.limit, LIMITS.register.windowMs).ok) {
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
