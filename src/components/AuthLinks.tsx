import Link from "next/link";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

/** Header links on public pages: "Dashboard" when signed in, otherwise Log in / Sign up. */
export async function AuthLinks() {
  // shortcut: checks only that the cookie exists (no DB query per visit); an expired session shows
  // "Dashboard", which then sends the student to /login.
  const signedIn = (await cookies()).has(SESSION_COOKIE);
  const button = "rounded-lg bg-brand-dark px-4 py-2 font-semibold text-white hover:bg-deep";
  if (signedIn)
    return (
      <Link href="/dashboard" className={button}>
        Dashboard
      </Link>
    );
  return (
    <>
      <Link href="/login" className="px-3 py-2 text-muted hover:text-deep">
        Log in
      </Link>
      <Link href="/register" className={button}>
        Sign up free
      </Link>
    </>
  );
}
