"use client";

import { ErrorScreen } from "@/components/ErrorScreen";

/** Errors inside any page: the site's layout stays, this replaces the page content. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={reset} />;
}
