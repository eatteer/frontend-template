import { describe, expect, it } from "vitest";

import { guardConsole } from "@test/console-guard";

describe("guardConsole", () => {
  it("records every console.error and console.warn call instead of printing it", () => {
    const guard = guardConsole();

    // eslint-disable-next-line no-console -- the console is what this suite is about, so this call is its input
    console.error("A component is changing %s input to be controlled", "an uncontrolled");
    // eslint-disable-next-line no-console -- the console is what this suite is about, so this call is its input
    console.warn("deprecated");

    const messages = guard.drain();

    guard.restore();

    expect(messages).toEqual([
      "console.error: A component is changing an uncontrolled input to be controlled",
      "console.warn: deprecated",
    ]);
  });

  it("empties its record when drained, so one test's calls are not reported by the next", () => {
    const guard = guardConsole();

    // eslint-disable-next-line no-console -- the console is what this suite is about, so this call is its input
    console.error("once");
    guard.drain();

    const messages = guard.drain();

    guard.restore();

    expect(messages).toEqual([]);
  });
});
