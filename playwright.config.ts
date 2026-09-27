import { defineConfig, devices } from "@playwright/test";

import { ADMIN_STORAGE_STATE, e2eEnv, PREVIEW_PORT, PREVIEW_URL } from "./e2e/support/env";

// Building the bundle and serving it takes a while on a cold machine.
const WEB_SERVER_TIMEOUT_MS = 180_000;

export default defineConfig({
  testDir: "./e2e",
  // One worker, in file order: every spec signs in as the same administrator against a real backend,
  // whose login is rate-limited per account and whose refresh tokens are single-use.
  workers: 1,
  fullyParallel: false,
  forbidOnly: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: e2eEnv.E2E_BASE_URL ?? PREVIEW_URL,
    trace: "retain-on-failure",
    // "Copy error" is asserted on what reaches the clipboard.
    permissions: ["clipboard-read", "clipboard-write"],
    locale: "en-US",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
  // The production build, not the dev server: that is what ships, the React Compiler included, and
  // outside production the router writes a console warning for every route that fails on purpose.
  webServer: e2eEnv.E2E_BASE_URL === undefined
    ? {
      command: `npm run build && npm run preview -- --port ${PREVIEW_PORT} --strictPort`,
      url: PREVIEW_URL,
      reuseExistingServer: false,
      timeout: WEB_SERVER_TIMEOUT_MS,
      stdout: "ignore",
    }
    : undefined,
});
