import Link from "next/link";
import { Logo } from "./Logo";
import { CookieSettingsButton } from "./CookieConsent";
import { logout } from "@/app/(auth)/actions";
import type { SafeUser } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/mock", label: "Mock Test" },
  { href: "/analytics", label: "Analytics" },
  { href: "/community", label: "Community" },
];

export function AppShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-10 border-b border-deep/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo href="/dashboard" />
          <nav className="flex gap-1 overflow-x-auto text-sm">
            {(user.role === "ADMIN" ? [...NAV, { href: "/admin", label: "Admin" }] : NAV).map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-muted hover:bg-brand-soft hover:text-deep">
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={logout} className="flex items-center gap-3">
            <span className="hidden text-sm text-muted md:inline">{user.name}</span>
            <button className="text-sm font-medium text-muted hover:text-deep">Log out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8 w-full">{children}</main>
      <footer className="mt-auto border-t border-deep/10 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} PlacePrep · Free placement aptitude practice</p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-deep">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-deep">
              Terms &amp; Conditions
            </Link>
            <Link href="/cookies" className="hover:text-deep">
              Cookie Policy
            </Link>
            <CookieSettingsButton className="text-muted hover:text-deep underline decoration-brand/50 underline-offset-4" />
          </nav>
        </div>
      </footer>
    </div>
  );
}
