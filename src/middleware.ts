import { NextResponse, type NextRequest } from "next/server";
import { isAdminSession, maintenanceOn } from "@/lib/maintenance";

// Cheap first gate: no session cookie → send to /login. The real check (is the session valid
// and unexpired?) happens on the server in requireUser()/getCurrentUser().
const PROTECTED = ["/dashboard", "/practice", "/mock", "/attempt", "/results", "/analytics", "/history", "/admin", "/onboarding", "/community", "/verify-email", "/account", "/code", "/dsa", "/google"];

// Reachable during maintenance, so an admin can still sign in (password or Google) and switch it off.
const OPEN_IN_MAINTENANCE = ["/maintenance", "/login", "/api/auth/", "/api/health"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Maintenance (admin panel switch, or MAINTENANCE_MODE=1 for everyone, admins too): files with an extension stay up.
  if (
    !pathname.includes(".") &&
    !OPEN_IN_MAINTENANCE.some((p) => pathname === p || pathname.startsWith(p)) &&
    (await maintenanceOn()) &&
    (process.env.MAINTENANCE_MODE === "1" || !(await isAdminSession(req.cookies.get("sid")?.value)))
  ) {
    const headers = { "Retry-After": "900", "Cache-Control": "no-store" };
    if (pathname.startsWith("/api")) return NextResponse.json({ error: "PlacePrep is down for maintenance. Please try again shortly." }, { status: 503, headers });
    return NextResponse.rewrite(new URL("/maintenance", req.url), { status: 503, headers });
  }
  if (pathname.startsWith("/api")) return NextResponse.next();
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

// Node runtime: the maintenance switch lives in Postgres (postgres.js does not run on the edge).
export const config = { runtime: "nodejs", matcher: ["/((?!_next|favicon.ico).*)"] };
