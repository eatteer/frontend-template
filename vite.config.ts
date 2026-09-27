import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Room for a `findBy*` that waits out its whole timeout (see test/setup.ts) and the steps around it.
const TEST_TIMEOUT_MS = 10_000;

export default defineConfig({
  plugins: [
    // Before the React plugin: it generates the route tree and splits each route's component into
    // its own chunk, and the React plugin has to see the code it produces.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    // Not under Vitest: the compiler adds a cache branch to every component, taken only on a
    // re-render with the same props, and coverage would count those as branches of our own code.
    // The compiled output is exercised by the end-to-end suite, which runs against the real build.
    ...(process.env.VITEST ? [] : [babel({ presets: [reactCompilerPreset()] })]),
    tailwindcss(),
  ],
  // Modules run in the order they are imported even when the bundler puts them in different chunks.
  // Without it, a chunk shared by several routes runs before the entry's own first import — the one
  // that configures Zod before any schema is built (see src/common/config/zod.ts).
  build: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
      },
    },
  },
  // The aliases are declared once, in tsconfig.app.json, and every tool reads them from there: the
  // compiler, the bundler and the test runner. (The shadcn CLI reads the root tsconfig.json.)
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    testTimeout: TEST_TIMEOUT_MS,
    // The configuration the tests run with, so a suite never depends on whoever's `.env` is on disk.
    env: {
      VITE_API_URL: "http://api.test",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // `common/ui/` is library code copied from shadcn; what gets tested is how the app uses it.
      exclude: ["src/common/ui/**", "src/main.tsx", "src/**/*.gen.ts", "src/**/*.test.{ts,tsx}"],
      reporter: ["text-summary", "lcov"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 85,
        lines: 90,
      },
    },
  },
});
