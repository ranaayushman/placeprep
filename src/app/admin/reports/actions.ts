"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { closeBankReports } from "@/lib/bank-reports";

/** Resolve (fixed) or dismiss (not a problem) every open report on one bank question. */
export async function closeReportsAction(form: FormData) {
  const staff = await requireStaff();
  const status = form.get("status") === "DISMISSED" ? "DISMISSED" : "RESOLVED";
  const n = await closeBankReports(staff.id, String(form.get("ref") ?? ""), status);
  revalidatePath("/admin/reports");
  redirect(`/admin/reports?msg=${encodeURIComponent(`${n} report${n === 1 ? "" : "s"} ${status === "RESOLVED" ? "marked fixed" : "dismissed"}.`)}`);
}
