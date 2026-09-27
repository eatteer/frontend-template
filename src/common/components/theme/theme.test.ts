import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyResolvedTheme,
  readStoredTheme,
  resolveTheme,
  startThemeTransition,
  THEME_STORAGE_KEY,
} from "@/common/components/theme/theme";

import { stubMatchMedia } from "@test/match-media";

const ORIGIN = { x: 100, y: 50 };

describe("readStoredTheme", () => {
  it("follows the system until the reader picks a theme", () => {
    expect(readStoredTheme()).toBe("system");
  });

  it("returns the theme the reader picked", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    expect(readStoredTheme()).toBe("dark");
  });

  it("ignores a stored value that is not a theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");

    expect(readStoredTheme()).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("replaces system with the system's own theme", () => {
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("light", "dark")).toBe("light");
  });
});

describe("applyResolvedTheme", () => {
  it("leaves exactly one theme class on the document", () => {
    applyResolvedTheme("dark");
    applyResolvedTheme("light");

    expect(document.documentElement.classList.value).toBe("light");
  });
});

describe("startThemeTransition", () => {
  afterEach(() => {
    Reflect.deleteProperty(document, "startViewTransition");
  });

  function stubViewTransition(): ReturnType<typeof vi.fn> {
    const startViewTransition = vi.fn((apply: () => void): void => {
      apply();
    });

    Object.defineProperty(document, "startViewTransition", { value: startViewTransition, configurable: true });

    return startViewTransition;
  }

  it("grows the new theme out of the origin", () => {
    const startViewTransition = stubViewTransition();
    const apply = vi.fn();

    startThemeTransition(apply, ORIGIN);

    expect(startViewTransition).toHaveBeenCalledWith(apply);
    expect(apply).toHaveBeenCalledOnce();

    expect(document.documentElement.style.getPropertyValue("--theme-transition-x")).toBe("100px");
    expect(document.documentElement.style.getPropertyValue("--theme-transition-radius")).not.toBe("");
  });

  it.each([
    ["without an origin", undefined, false],
    ["for a reader who asked for less motion", ORIGIN, true],
  ])("changes the theme at once %s", (_case: string, origin: typeof ORIGIN | undefined, prefersReducedMotion: boolean) => {
    stubMatchMedia({ prefersReducedMotion });

    const startViewTransition = stubViewTransition();
    const apply = vi.fn();

    startThemeTransition(apply, origin);

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(apply).toHaveBeenCalledOnce();
  });

  it("changes the theme at once where view transitions do not exist", () => {
    const apply = vi.fn();

    startThemeTransition(apply, ORIGIN);

    expect(apply).toHaveBeenCalledOnce();
  });
});
