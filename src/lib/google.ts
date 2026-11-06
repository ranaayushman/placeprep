import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** Google sign-in (OAuth 2.0 authorization code + PKCE). Enabled only when both env vars are set. */
export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const OAUTH_COOKIE = "g_oauth";
const redirectUri = () => `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`;

export function startGoogleAuth() {
  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), cookie: `${state}.${verifier}` };
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
}

/** Exchanges the code and returns the verified Google profile, or null if anything is off. */
export async function finishGoogleAuth(code: string, verifier: string): Promise<GoogleProfile | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      code_verifier: verifier,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) return null;
  // The ID token came straight from Google's token endpoint over TLS, so per OpenID Connect the
  // signature check can be skipped; the audience, issuer, expiry and verified email still must hold.
  const p = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString()) as Record<string, unknown>;
  const ok =
    p.aud === process.env.GOOGLE_CLIENT_ID &&
    (p.iss === "https://accounts.google.com" || p.iss === "accounts.google.com") &&
    typeof p.exp === "number" && p.exp * 1000 > Date.now() &&
    p.email_verified === true && typeof p.email === "string" && typeof p.sub === "string";
  if (!ok) return null;
  const email = (p.email as string).toLowerCase();
  const name = (typeof p.name === "string" && p.name.trim()) || email.split("@")[0];
  return { sub: p.sub as string, email, name: name.slice(0, 60) };
}
