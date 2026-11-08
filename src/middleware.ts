import { NextResponse, type NextRequest } from "next/server";

// Cheap first gate: no session cookie → send to /login. The real check (is the session valid
// and unexpired?) happens on the server in requireUser()/getCurrentUser().
const PROTECTED = ["/dashboard", "/practice", "/mock", "/attempt", "/results", "/analytics", "/admin", "/onboarding", "/community", "/verify-email", "/account"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !req.cookies.has("sid")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
