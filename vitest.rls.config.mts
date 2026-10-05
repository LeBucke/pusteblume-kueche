import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// RLS Tests laufen gegen das verknüpfte Supabase Projekt (npm run test:rls), nicht in npm test.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["supabase/tests/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
