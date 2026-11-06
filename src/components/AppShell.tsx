import Link from "next/link";
import { Logo } from "./Logo";
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
    <div className="min-h-screen bg-canvas">
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
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
