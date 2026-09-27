// The tests parse the way the browser does.
import "@/common/config/zod";
import "@testing-library/jest-dom/vitest";

import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

import { i18n } from "@/common/i18n/i18n";
import { DEFAULT_LANGUAGE } from "@/common/i18n/languages";
import { consoleErrorReporter, setErrorReporter } from "@/common/lib/error-reporter";
import { ignoreWebVitals, setWebVitalsReporter } from "@/common/lib/web-vitals";
import { toast } from "@/common/ui/toast";

import { guardConsole } from "@test/console-guard";
import { stubMatchMedia } from "@test/match-media";
import { server } from "@test/msw/server";

// A route renders only after its guard has read the session and its code-split chunk has loaded. The
// first route a file renders transforms those chunks cold, and with every file running at once that
// has taken close to 4 s — far past the default second of `findBy*`.
const ASYNC_UTIL_TIMEOUT_MS = 5000;

configure({ asyncUtilTimeout: ASYNC_UTIL_TIMEOUT_MS });

let consoleGuard: ReturnType<typeof guardConsole>;

// A request no handler answers fails the test instead of reaching the network.
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// jsdom has no scrolling, and says so on its own console every time the router restores a position —
// a line that is not the application's and that the console guard never sees.
beforeEach(() => {
  consoleGuard = guardConsole();

  stubMatchMedia();
  vi.stubGlobal("scrollTo", (): void => {});
});

// Everything a test can leave behind in the page: open toasts, stored preferences, the theme class,
// the language, a replaced reporter.
afterEach(async () => {
  cleanup();
  setErrorReporter(consoleErrorReporter);
  setWebVitalsReporter(ignoreWebVitals);
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
