import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatusPage } from "@/components/StatusPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Down for maintenance", robots: { index: false } };

/** Shown for every page while MAINTENANCE_MODE=1 (the middleware rewrites to it with a 503). */
export default function Maintenance() {
  if (process.env.MAINTENANCE_MODE !== "1") notFound();
  return (
    <StatusPage code="503" title="PlacePrep is down for maintenance" actions={null}>
      <p>We're making some improvements and will be back shortly. Your practice history and results are safe.</p>
    </StatusPage>
  );
}
