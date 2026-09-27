import { afterEach, describe, expect, it, vi } from "vitest";

import { publishSessionEvent, SESSION_CHANNEL_NAME, subscribeToSessionEvents } from "@/common/api/session-events";

// Another tab, as far as this one can tell: a second channel on the same name.
const otherTab = new BroadcastChannel(SESSION_CHANNEL_NAME);

let unsubscribe: (() => void) | undefined;

describe("session events", () => {
  afterEach(() => {
    unsubscribe?.();
  });

  it("tells this tab's listeners about its own events", () => {
    const listener = vi.fn();

    unsubscribe = subscribeToSessionEvents(listener);
    publishSessionEvent({ type: "signed-out", reason: "sign-out" });

    expect(listener).toHaveBeenCalledWith({ type: "signed-out", reason: "sign-out" }, false);
  });

  it("tells them about another tab's events, marked as remote", async () => {
    const listener = vi.fn();

    unsubscribe = subscribeToSessionEvents(listener);
    otherTab.postMessage({ type: "signed-in" });

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledWith({ type: "signed-in" }, true);
    });
  });

  it("ignores a message that is not a session event", async () => {
    const listener = vi.fn();

    unsubscribe = subscribeToSessionEvents(listener);
    otherTab.postMessage({ type: "signed-out", reason: "bored" });
    otherTab.postMessage("refreshed");
    otherTab.postMessage({ type: "refreshed" });

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledWith({ type: "refreshed" }, true);
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops telling a listener that unsubscribed", () => {
    const listener = vi.fn();

    subscribeToSessionEvents(listener)();
    publishSessionEvent({ type: "refreshed" });

    expect(listener).not.toHaveBeenCalled();
  });
});
