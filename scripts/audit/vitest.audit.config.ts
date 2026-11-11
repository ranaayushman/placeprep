import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Bank audit: how many DISTINCT questions each topic can produce. No DB, no global setup.
 *   npx vitest run --config scripts/audit/vitest.audit.config.ts
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "../../src") } },
  test: { include: ["scripts/audit/*.test.ts"], environment: "node" },
});
