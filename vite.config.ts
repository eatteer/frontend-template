import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
  // The aliases are declared once, in tsconfig.app.json, and every tool reads them from there: the
  // compiler, the bundler, the test runner and the shadcn CLI.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
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
