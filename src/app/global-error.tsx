"use client";

import "./globals.css";
import { ErrorScreen } from "@/components/ErrorScreen";

/** Errors in the root layout itself; replaces Next's blank "Application error" screen. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body className="bg-canvas">
        <ErrorScreen error={error} />
      </body>
    </html>
  );
}
