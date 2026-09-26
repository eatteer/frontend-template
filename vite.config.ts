import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
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
