import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatusPage } from "@/components/StatusPage";
import { maintenanceOn } from "@/lib/maintenance";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Down for maintenance", robots: { index: false } };

/** Shown for every page while maintenance is on (the middleware rewrites to it with a 503). */
export default async function Maintenance() {
  if (!(await maintenanceOn())) notFound();
  return (
    <StatusPage code="503" title="PlacePrep is down for maintenance" actions={null}>
      <p>We're making some improvements and will be back shortly. Your practice history and results are safe.</p>
    </StatusPage>
  );
}
