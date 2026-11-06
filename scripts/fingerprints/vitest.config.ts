import { defineConfig } from "vitest/config";
import path from "node:path";

// Runs the seeding "test" against DATABASE_URL (unlike the main config, which forces the test DB).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../../src"),
      "server-only": path.resolve(__dirname, "../../tests/server-only-stub.ts"),
    },
  },
  test: { include: ["scripts/fingerprints/*.fingerprints.ts"], testTimeout: 120_000 },
});
