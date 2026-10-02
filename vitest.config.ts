import path from "node:path";

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "vitest.server-only.ts"),
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
