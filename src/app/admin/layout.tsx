import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";

export const metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/blocked", label: "Block list" },
  { href: "/admin/community", label: "Community" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/announcements", label: "Updates" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireStaff();
  const isMod = admin.role === "MODERATOR";
  // Moderators see only the question tools; each admin-only page also checks requireAdmin itself.
  const nav = isMod ? [{ href: "/admin", label: "Overview" }, { href: "/admin/community", label: "Review questions" }, { href: "/community/submit", label: "Add a question" }] : NAV;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <Logo href="/admin" onDark />
              <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-900">{isMod ? "Moderator" : "Admin"}</span>
            </div>
            <ProfileMenu name={admin.name} email={admin.email} admin />
          </div>
          {/* Own row, so the tabs never squeeze against the logo and menu; scrolls sideways on phones. */}
          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-2 text-sm">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
