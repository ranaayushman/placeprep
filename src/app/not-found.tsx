import type { Metadata } from "next";
import Link from "next/link";
import { PRIMARY, SECONDARY, StatusPage } from "@/components/StatusPage";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** Every 404, including notFound() calls (e.g. admin pages for non-admins, someone else's result). */
export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="This page doesn't exist"
      actions={
        <>
          <Link href="/dashboard" className={PRIMARY}>Go to my dashboard</Link>
          <Link href="/" className={SECONDARY}>Home</Link>
        </>
      }
    >
      <p>The link may be old or mistyped. Your practice and results are safe.</p>
    </StatusPage>
  );
}
