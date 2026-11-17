import { NextResponse, type NextRequest } from "next/server";

// Cheap first gate: no session cookie → send to /login. The real check (is the session valid
// and unexpired?) happens on the server in requireUser()/getCurrentUser().
const PROTECTED = ["/dashboard", "/practice", "/mock", "/attempt", "/results", "/analytics", "/history", "/admin", "/onboarding", "/community", "/verify-email", "/account", "/code", "/dsa", "/google"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !req.cookies.has("sid")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  // Backfill for sessions made before the signed_in flag existed (see SIGNED_IN_COOKIE in lib/auth.ts).
  if (req.cookies.has("sid") && !req.cookies.has("signed_in")) res.cookies.set("signed_in", "1", { sameSite: "lax", secure: req.nextUrl.protocol === "https:", path: "/", maxAge: 30 * 86_400 });
  return res;
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
