import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Standalone config for the independent verification harness: no DB, no global setup.
 *   npx vitest run --config scripts/verify/vitest.verify.config.ts
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "../../src") } },
  test: {
    include: ["scripts/verify/independent.test.ts"],
    globals: false,
    environment: "node",
  },
});
