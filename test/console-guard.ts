import { format } from "node:util";

import { vi } from "vitest";

const GUARDED_METHODS = ["error", "warn"] as const;

type ConsoleGuard = {
  drain: () => string[];
  restore: () => void;
};

// React reports what it considers a bug — an input switching from uncontrolled to controlled, a
// missing key, an update outside act() — through console.error and carries on rendering, so a test
// asserting on the screen still passes. Recording every call and failing the test on it turns those
// reports into the failures they describe.
export function guardConsole(): ConsoleGuard {
  const messages: string[] = [];

  const spies = GUARDED_METHODS.map((method: (typeof GUARDED_METHODS)[number]) => vi
    .spyOn(console, method)
    .mockImplementation((...args: unknown[]): void => {
      messages.push(`console.${method}: ${format(...args)}`);
    }));

  return {
    drain: (): string[] => messages.splice(0),
    restore: (): void => {
      spies.forEach((spy: { mockRestore: () => void }): void => { spy.mockRestore(); });
    },
  };
}
