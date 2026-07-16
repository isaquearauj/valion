import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: {
        branches: 59,
        functions: 67,
        lines: 73,
        statements: 73,
      },
    },
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "tests/integration/**"],
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
})
