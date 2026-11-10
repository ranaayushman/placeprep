"use client";

import { useEffect } from "react";
import { PRIMARY, SECONDARY, StatusPage } from "./StatusPage";
import { reportClientError } from "./ErrorReporter";

/**
 * Errors that mean "this tab is running an older deploy": its code files or server actions no longer
 * exist on the server. A reload fixes them. (Safari words a missing chunk "Importing a module script failed".)
 */
const STALE = /ChunkLoadError|Loading chunk|Failed to find Server Action|dynamically imported module|Importing a module script failed|Failed to fetch/i;
const RELOADED_AT = "pp-stale-reload";

export function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset?: () => void }) {
  const stale = STALE.test(`${error.name} ${error.message}`);
  useEffect(() => {
    console.error(error);
    reportClientError(error);
    // Reload once for a stale tab; the time check stops a reload loop if the error is something else.
    const last = Number(sessionStorage.getItem(RELOADED_AT) ?? 0);
    if (stale && Date.now() - last > 30_000) {
      sessionStorage.setItem(RELOADED_AT, String(Date.now()));
      window.location.reload();
    }
  }, [error, stale]);

  return (
    <StatusPage
      code={stale ? "↻" : "500"}
      title={stale ? "PlacePrep was just updated" : "Something went wrong"}
      actions={
        <>
          <button type="button" onClick={() => window.location.reload()} className={PRIMARY}>Reload</button>
          {reset && !stale && <button type="button" onClick={reset} className={SECONDARY}>Try again</button>}
          <a href="/" className={SECONDARY}>Home</a>
        </>
      }
    >
      <p>{stale ? "Reload the page to get the latest version. Your saved answers are safe." : "Reload the page to try again. If it keeps happening, email support@placeprep.me."}</p>
      {error.digest && <p className="mt-3 font-mono text-xs text-muted/70">Error code: {error.digest}</p>}
    </StatusPage>
  );
}
