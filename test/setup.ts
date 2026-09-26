import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { guardConsole } from "@test/console-guard";
import { server } from "@test/msw/server";

let consoleGuard: ReturnType<typeof guardConsole>;

// A request no handler answers fails the test instead of reaching the network.
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  consoleGuard = guardConsole();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();

  const messages = consoleGuard.drain();

  consoleGuard.restore();

  if (messages.length > 0) {
    throw new Error(`The test wrote to the console, which fails it:\n${messages.join("\n")}`);
  }
});

afterAll(() => {
  server.close();
});
