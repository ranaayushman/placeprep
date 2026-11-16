import { NextResponse, type NextRequest } from "next/server";
import { isRefCode, REF_COOKIE, REF_COOKIE_MAX_AGE } from "@/lib/referral";

/** Invite link: remembers who shared it, then goes to sign-up. Checked against the DB only at sign-up. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toLowerCase();
  const res = NextResponse.redirect(new URL("/register", req.url));
  if (isRefCode(code)) {
    res.cookies.set(REF_COOKIE, code, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: REF_COOKIE_MAX_AGE, path: "/" });
  }
  return res;
}
