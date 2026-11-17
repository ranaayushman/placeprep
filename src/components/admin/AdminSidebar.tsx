"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type NavGroup = { title: string; items: { href: string; label: string; badge?: number }[] };

/** Grouped admin navigation: a sticky, collapsible sidebar on desktop, a sideways-scrolling row on phones. */
export function AdminSidebar({ groups }: { groups: NavGroup[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try { setOpen(localStorage.getItem("admin:nav") !== "closed"); } catch {}
  }, []);
  const toggle = () => {
    setOpen(!open);
    try { localStorage.setItem("admin:nav", open ? "closed" : "open"); } catch {}
  };
  // Longest matching href wins, so /admin/users/123 highlights "Users", not "Overview".
  const active = groups
    .flatMap((g) => g.items.map((i) => i.href))
    .filter((h) => path === h || path.startsWith(`${h}/`))
    .sort((a, b) => b.length - a.length)[0];
  const link = (i: NavGroup["items"][number]) => (
    <Link
      key={i.href}
      href={i.href}
      aria-current={i.href === active ? "page" : undefined}
      className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${i.href === active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      {i.label}
      {!!i.badge && <span className="rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">{i.badge}</span>}
    </Link>
  );
  return (
    <>
      <nav aria-label="Admin" className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 pl-4 pr-10 pb-2 [mask-image:linear-gradient(to_right,#000_90%,transparent)] lg:hidden">
        {groups.flatMap((g) => g.items).map(link)}
      </nav>
      {!open && (
        <button type="button" onClick={toggle} aria-expanded={false} aria-controls="admin-nav" title="Show menu" className="sticky top-20 hidden h-8 w-8 shrink-0 items-center justify-center self-start rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:flex">
          <span aria-hidden>»</span>
          <span className="sr-only">Show admin menu</span>
        </button>
      )}
      <nav id="admin-nav" aria-label="Admin" className={`sticky top-20 max-h-[calc(100vh-6rem)] w-52 shrink-0 space-y-5 self-start overflow-y-auto ${open ? "hidden lg:block" : "hidden"}`}>
        <button type="button" onClick={toggle} aria-expanded aria-controls="admin-nav" className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <span aria-hidden>«</span> Hide menu
        </button>
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g.title}</p>
            <div className="space-y-0.5">{g.items.map(link)}</div>
          </div>
        ))}
      </nav>
    </>
  );
}
