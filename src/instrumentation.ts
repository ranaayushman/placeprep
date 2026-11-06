/**
 * Runs once when the server boots. The `NEXT_RUNTIME` check is replaced at build time, so the
 * Node-only migration code is never bundled for the edge runtime (middleware).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
