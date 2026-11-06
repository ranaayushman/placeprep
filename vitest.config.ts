import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" throws outside a React Server Components build; stub it for tests.
      "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // Always a local throwaway DB, never the DATABASE_URL from .env (e.g. Supabase).
    env: { DATABASE_URL: "postgres://localhost:5432/placeprep_test" },
    fileParallelism: false,
    globalSetup: ["tests/global-setup.ts"],
  },
});
