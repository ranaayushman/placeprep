import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../../src"),
      "server-only": path.resolve(__dirname, "../../tests/server-only-stub.ts"),
      "next/headers": path.resolve(__dirname, "../../tests/server-only-stub.ts"),
    },
  },
  test: { include: ["scripts/load/*.load.ts"], testTimeout: 600_000 },
});
