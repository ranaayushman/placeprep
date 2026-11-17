import { requireStaff } from "@/lib/auth";
import { maintenanceOn } from "@/lib/maintenance";
import Link from "next/link";
import { pendingDeletionCount } from "@/lib/deletion-requests";
import { Logo } from "@/components/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { AdminSidebar, type NavGroup } from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin", robots: { index: false } };

const groups = (deletions: number): NavGroup[] => [
  { title: "Overview", items: [{ href: "/admin", label: "Overview" }] },
  {
    title: "People",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/leaderboard", label: "Leaderboard" },
      { href: "/admin/blocked", label: "Block list" },
      { href: "/admin/deletions", label: "Deletions", badge: deletions },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/mocks", label: "Mocks" },
      { href: "/admin/community", label: "Community" },
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/feedback", label: "Feedback" },
    ],
  },
  {
    title: "Growth",
    items: [
      { href: "/admin/growth", label: "Growth" },
      { href: "/admin/campaigns", label: "Campaigns" },
      { href: "/admin/announcements", label: "Updates" },
    ],
  },
  { title: "System", items: [{ href: "/admin/activity", label: "Activity" }, { href: "/admin/errors", label: "Errors" }] },
  // Admin-only student pages (others need a grant on their user page).
  {
    title: "Your tools",
    items: [
      { href: "/google", label: "Google SDE path" },
      { href: "/dsa", label: "DSA track" },
      { href: "/code", label: "Code practice" },
    ],
  },
];

const MOD_GROUPS: NavGroup[] = [
  {
    title: "Moderation",
    items: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/community", label: "Review questions" },
      { href: "/community/submit", label: "Add a question" },
      { href: "/admin/mocks", label: "Mock exams" },
      { href: "/admin/reports", label: "Question reports" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireStaff();
  const isMod = admin.role === "MODERATOR";
  // Moderators see only the question tools; each admin-only page also checks requireAdmin itself.
  // The deletion count sits in the nav so a legal deadline is never out of sight.
  const deletions = isMod ? 0 : await pendingDeletionCount();
  const nav = isMod ? MOD_GROUPS : groups(deletions);
  const down = await maintenanceOn();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <Logo href="/admin" onDark />
              <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-900">{isMod ? "Moderator" : "Admin"}</span>
            </div>
            <ProfileMenu name={admin.name} email={admin.email} admin googlePath={!isMod} />
          </div>
        </div>
      </header>
      {down && (
        <p role="status" className="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
          Maintenance mode is on: the site is closed to everyone except admins.{" "}
          {!isMod && <Link href="/admin" className="underline">Turn it off on the Overview page</Link>}
        </p>
      )}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8 lg:py-8">
        <AdminSidebar groups={nav} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
