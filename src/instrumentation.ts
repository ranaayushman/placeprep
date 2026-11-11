/**
 * Runs once when the server boots. The `NEXT_RUNTIME` check is replaced at build time, so the
 * Node-only migration code is never bundled for the edge runtime (middleware).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}

/** Every server-side error in a page, route or action is recorded for Admin → Errors. */
export async function onRequestError(err: unknown, request: { path: string; headers: Record<string, string | string[] | undefined> }) {
  // Same shape as register(): the import must sit inside this check, or the DB driver is bundled for the edge runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { recordError } = await import("./lib/app-errors");
    const e = err as Error & { digest?: string; cause?: { message?: string; code?: string } };
    const ua = request.headers["user-agent"];
    // Drizzle's "Failed query" hides the real DB error in `cause`; drop the per-user params so the same error groups once.
    const why = e?.cause ? ` — cause: ${e.cause.code ?? ""} ${e.cause.message ?? String(e.cause)}` : "";
    const message = (e?.message ?? String(err)).split("\nparams:")[0] + why;
    await recordError({ source: "server", message, stack: e?.stack, digest: e?.digest, path: request.path, userAgent: Array.isArray(ua) ? ua[0] : ua });
  }
}
