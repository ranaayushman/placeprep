import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardedAt) redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
  const [p] = await db
    .select({ college: users.college, degree: users.degree, branch: users.branch, passoutYear: users.passoutYear, dreamCompany: users.dreamCompany })
    .from(users)
    .where(eq(users.id, user.id));
  return <OnboardingForm firstName={user.name.split(" ")[0]} initial={p} />;
}
