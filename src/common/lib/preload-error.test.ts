import { describe, expect, it, vi } from "vitest";

import {
  handlePreloadError,
  PRELOAD_ERROR_EVENT,
  RELOAD_GUARD_STORAGE_KEY,
  RELOAD_GUARD_WINDOW_MS,
  reloadOnPreloadError,
} from "@/common/lib/preload-error";

const NOW = 1_000_000;

describe("handlePreloadError", () => {
  it("reloads to pick up the current deployment, and says it handled the error", () => {
    const event = new Event(PRELOAD_ERROR_EVENT, { cancelable: true });
    const reload = vi.fn();

    handlePreloadError(event, reload, NOW);

    expect(reload).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    expect(sessionStorage.getItem(RELOAD_GUARD_STORAGE_KEY)).toBe(String(NOW));
  });

  it("lets the error through when a reload just failed to fix it", () => {
    const event = new Event(PRELOAD_ERROR_EVENT, { cancelable: true });
    const reload = vi.fn();

    sessionStorage.setItem(RELOAD_GUARD_STORAGE_KEY, String(NOW - RELOAD_GUARD_WINDOW_MS + 1));
    handlePreloadError(event, reload, NOW);

    expect(reload).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("reloads again once the window has passed", () => {
    const reload = vi.fn();

    sessionStorage.setItem(RELOAD_GUARD_STORAGE_KEY, String(NOW - RELOAD_GUARD_WINDOW_MS));
    handlePreloadError(new Event(PRELOAD_ERROR_EVENT), reload, NOW);

    expect(reload).toHaveBeenCalledOnce();
  });
});

describe("reloadOnPreloadError", () => {
  it("listens for the event until it is stopped", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");

    const stop = reloadOnPreloadError();

    stop();

    expect(addEventListener).toHaveBeenCalledWith(PRELOAD_ERROR_EVENT, expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith(PRELOAD_ERROR_EVENT, addEventListener.mock.calls[0]?.[1]);
  });
});
