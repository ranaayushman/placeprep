import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { googleEnabled } from "@/lib/google";
import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

// Account pages, not landing pages: crawlable (so the tag is seen) but kept out of search results.
export const metadata: Metadata = { title: "Create your free account", robots: { index: false, follow: true } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const { error } = await searchParams;
  return <AuthForm mode="register" google={googleEnabled()} errorCode={error} />;
}
