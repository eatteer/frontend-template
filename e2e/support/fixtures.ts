import { test as base, expect } from "@playwright/test";

import type { BrowserContext, ConsoleMessage, WebError } from "@playwright/test";

// Chrome writes one of these for every response with an error status. The flows provoke 400, 401
// and 409 on purpose, and the page shows each one; a 5xx or a failed connection still fails the test.
const EXPECTED_HTTP_ERROR = /^Failed to load resource: the server responded with a status of 4\d\d/;

// What the page calls to hand the guard a refusal of the Content-Security-Policy.
declare global {
  interface Window {
    reportPolicyViolation: (violation: string) => void;
  }
}

type ConsoleGuard = {
  messages: () => string[];
};

// Chrome does not write every refusal of the Content-Security-Policy to the console — not one a
// library catches, like a probe for `new Function` — but the page hears each one as an event. Only a
// run against the image has the policy. It runs in the page, so it reaches nothing of this module.
function listenForPolicyViolations(): void {
  document.addEventListener("securitypolicyviolation", (event: SecurityPolicyViolationEvent): void => {
    window.reportPolicyViolation(`${event.effectiveDirective} at ${event.sourceFile}:${event.lineNumber}`);
  });
}

// The same rule the component tests follow: whatever React, the application or the browser writes as
// an error or a warning fails the test — the controlled/uncontrolled warning, a key missing from a
// list, an error nobody caught — and so does anything the policy refused.
export async function guardConsole(context: BrowserContext): Promise<ConsoleGuard> {
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

  await context.exposeBinding("reportPolicyViolation", (_source: unknown, violation: string): void => {
    messages.push(`Content-Security-Policy refused ${violation}`);
  });

  await context.addInitScript(listenForPolicyViolations);

  return { messages: (): string[] => [...messages] };
}

export const test = base.extend<{ consoleGuard: ConsoleGuard }>({
  consoleGuard: [
    async ({ context }: { context: BrowserContext }, use: (guard: ConsoleGuard) => Promise<void>): Promise<void> => {
      const guard = await guardConsole(context);

      await use(guard);

      expect(guard.messages(), "The page wrote to the console").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
