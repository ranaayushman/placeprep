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
    const e = err as Error & { digest?: string };
    const ua = request.headers["user-agent"];
    await recordError({ source: "server", message: e?.message ?? String(err), stack: e?.stack, digest: e?.digest, path: request.path, userAgent: Array.isArray(ua) ? ua[0] : ua });
  }
}
