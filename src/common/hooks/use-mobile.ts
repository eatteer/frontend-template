import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void): () => void {
  const mediaQueryList = window.matchMedia(MOBILE_QUERY);

  mediaQueryList.addEventListener("change", onChange);

  return (): void => { mediaQueryList.removeEventListener("change", onChange); };
}

function isMobileViewport(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

// An external store rather than state set from an effect: the first render already has the right
// answer, instead of rendering the desktop layout once and correcting it a frame later.
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, isMobileViewport);
}
