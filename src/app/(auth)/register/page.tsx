import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { googleEnabled } from "@/lib/google";
import { AuthForm } from "../AuthForm";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const { error } = await searchParams;
  return <AuthForm mode="register" google={googleEnabled()} errorCode={error} />;
}
