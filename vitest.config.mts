import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./vitest.server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Logic we own and unit-test. UI, routes and DB adapters are checked by the demo run-through.
      include: [
        "src/server/services/**/*.ts",
        "src/shared/models/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/fixtures.ts", "**/__fixtures__/**", "src/server/services/index.ts"],
    },
  },
});
