import type { Metadata } from "next";
import Link from "next/link";
import { PRIMARY, StatusPage } from "@/components/StatusPage";
import { maintenanceOn } from "@/lib/maintenance";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Down for maintenance", robots: { index: false } };

/** Shown for every page while maintenance is on (the middleware rewrites to it with a 503). */
export default async function Maintenance() {
  // Off already: an old tab, or up to 10 s after an admin reopens the site (the middleware's cached flag).
  if (!(await maintenanceOn()))
    return (
      <StatusPage code="✓" title="PlacePrep is back" actions={<Link href="/dashboard" className={PRIMARY}>Go to my dashboard</Link>}>
        <p>Maintenance is over. If you still see the notice, reload in a few seconds.</p>
      </StatusPage>
    );
  return (
    <StatusPage code="503" title="PlacePrep is down for maintenance" actions={null}>
      <p>We're making some improvements and will be back shortly. Your practice history and results are safe.</p>
    </StatusPage>
  );
}
