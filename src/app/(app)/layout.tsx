import { AppShell } from "@/components/AppShell";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Students finish their profile before using the app; admins can skip it.
  if (!user.onboardedAt && user.role !== "ADMIN") redirect("/onboarding");
  return <AppShell user={user}>{children}</AppShell>;
}
