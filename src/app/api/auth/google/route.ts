import { NextResponse } from "next/server";
import { googleEnabled, OAUTH_COOKIE, startGoogleAuth } from "@/lib/google";

export async function GET(req: Request) {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?error=google_off", req.url));
  const { url, cookie } = startGoogleAuth();
  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax", // sent on Google's top-level redirect back to us
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
