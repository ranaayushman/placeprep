import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { logout } from "@/app/(auth)/actions";

export const metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/blocked", label: "Block list" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo href="/admin" onDark />
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-900">Admin</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                {n.label}
              </Link>
            ))}
            <Link href="/dashboard" className="whitespace-nowrap rounded-md px-3 py-1.5 text-slate-400 hover:text-white">Student view ↗</Link>
          </nav>
          <form action={logout} className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-400 md:inline">{admin.email}</span>
            <button className="text-slate-300 hover:text-white">Log out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
