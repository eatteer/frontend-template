import { vi } from "vitest";

type MediaFeatures = {
  prefersDark?: boolean;
  prefersReducedMotion?: boolean;
};

type MatchMediaStub = {
  setPrefersDark: (prefersDark: boolean) => void;
};

const DARK_QUERY = "(prefers-color-scheme: dark)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// jsdom has no matchMedia. This answers the two preferences the application asks about, and lets a
// test flip the colour scheme the way the operating system would.
export function stubMatchMedia({ prefersDark = false, prefersReducedMotion = false }: MediaFeatures = {}): MatchMediaStub {
  const darkQuery = Object.assign(new EventTarget(), { matches: prefersDark, media: DARK_QUERY });

  vi.stubGlobal("matchMedia", (query: string): EventTarget & { matches: boolean; media: string } => {
    if (query === DARK_QUERY) {
      return darkQuery;
    }

    return Object.assign(new EventTarget(), { matches: query === REDUCED_MOTION_QUERY && prefersReducedMotion, media: query });
  });

  return {
    setPrefersDark: (nextPrefersDark: boolean): void => {
      darkQuery.matches = nextPrefersDark;
      darkQuery.dispatchEvent(new Event("change"));
    },
  };
}
