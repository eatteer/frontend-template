import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { i18n } from "@/common/i18n/i18n";
import { DEFAULT_LANGUAGE } from "@/common/i18n/languages";
import { toast } from "@/common/ui/toast";

import { guardConsole } from "@test/console-guard";
import { stubMatchMedia } from "@test/match-media";
import { server } from "@test/msw/server";

let consoleGuard: ReturnType<typeof guardConsole>;

// A request no handler answers fails the test instead of reaching the network.
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  consoleGuard = guardConsole();
  stubMatchMedia();
});

// Everything a test can leave behind in the page: open toasts, stored preferences, the theme class,
// the language.
afterEach(async () => {
  cleanup();
  server.resetHandlers();
  toast.close();
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.className = "";

  await i18n.changeLanguage(DEFAULT_LANGUAGE);

  const messages = consoleGuard.drain();

  consoleGuard.restore();

  if (messages.length > 0) {
    throw new Error(`The test wrote to the console, which fails it:\n${messages.join("\n")}`);
  }
});

afterAll(() => {
  server.close();
});
