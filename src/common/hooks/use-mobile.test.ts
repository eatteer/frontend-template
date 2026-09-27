import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useIsMobile } from "@/common/hooks/use-mobile";

const DESKTOP_WIDTH = 1280;
const PHONE_WIDTH = 390;

// jsdom has no matchMedia. The hook only subscribes to the query's change event and reads the width
// itself, so an event target is all the stand-in has to be.
function stubViewport(width: number): { resize: (next: number) => void } {
  const mediaQueryList = new EventTarget();

  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("matchMedia", (): EventTarget => mediaQueryList);

  return {
    resize: (next: number): void => {
      vi.stubGlobal("innerWidth", next);

      mediaQueryList.dispatchEvent(new Event("change"));
    },
  };
}

describe("useIsMobile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is false on a desktop viewport", () => {
    stubViewport(DESKTOP_WIDTH);

    const { result } = renderHook(useIsMobile);

    expect(result.current).toBe(false);
  });

  it("follows the viewport when it crosses the breakpoint", () => {
    const viewport = stubViewport(DESKTOP_WIDTH);

    const { result } = renderHook(useIsMobile);

    act(() => { viewport.resize(PHONE_WIDTH); });

    expect(result.current).toBe(true);
  });
});
