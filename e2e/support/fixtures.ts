import { test as base, expect } from "@playwright/test";

import type { BrowserContext, ConsoleMessage, WebError } from "@playwright/test";

// Chrome writes one of these for every response with an error status. The flows provoke 400, 401
// and 409 on purpose, and the page shows each one; a 5xx or a failed connection still fails the test.
const EXPECTED_HTTP_ERROR = /^Failed to load resource: the server responded with a status of 4\d\d/;

type ConsoleGuard = {
  messages: () => string[];
};

// The same rule the component tests follow: whatever React, the application or the browser writes as
// an error or a warning fails the test — the controlled/uncontrolled warning, a key missing from a
// list, an error nobody caught.
export function guardConsole(context: BrowserContext): ConsoleGuard {
  const messages: string[] = [];

  context.on("console", (message: ConsoleMessage): void => {
    const type = message.type();

    if ((type === "error" || type === "warning") && !EXPECTED_HTTP_ERROR.test(message.text())) {
      messages.push(`console.${type}: ${message.text()} (${message.location().url})`);
    }
  });

  context.on("weberror", (webError: WebError): void => {
    messages.push(`uncaught: ${webError.error().message}`);
  });

  return { messages: (): string[] => [...messages] };
}

export const test = base.extend<{ consoleGuard: ConsoleGuard }>({
  consoleGuard: [
    async ({ context }: { context: BrowserContext }, use: (guard: ConsoleGuard) => Promise<void>): Promise<void> => {
      const guard = guardConsole(context);

      await use(guard);

      expect(guard.messages(), "The page wrote to the console").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
