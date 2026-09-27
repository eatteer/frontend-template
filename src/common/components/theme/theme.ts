export const THEME_VALUES = ["light", "dark", "system"] as const;

export type Theme = (typeof THEME_VALUES)[number];

export const RESOLVED_THEME_VALUES = ["light", "dark"] as const;

export type ResolvedTheme = (typeof RESOLVED_THEME_VALUES)[number];

export type TransitionOrigin = {
  x: number;
  y: number;
};

export const THEME_STORAGE_KEY = "theme";

const DARK_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const TRANSITION_X_PROPERTY = "--theme-transition-x";
const TRANSITION_Y_PROPERTY = "--theme-transition-y";
const TRANSITION_RADIUS_PROPERTY = "--theme-transition-radius";

// The circle grows past the farthest corner so the easing's slow tail plays out off-screen. Stopping
// exactly at the corner leaves a visible wedge inside the part of the curve that barely moves, and
// the reveal seems to freeze just before it ends.
const REVEAL_RADIUS_OVERSHOOT = 1.15;

export function isTheme(value: string | null): value is Theme {
  return (THEME_VALUES as readonly (string | null)[]).includes(value);
}

export function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  return isTheme(stored) ? stored : "system";
}

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches ? "dark" : "light";
}

export function subscribeToSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_COLOR_SCHEME_QUERY);

  query.addEventListener("change", onChange);

  return (): void => {
    query.removeEventListener("change", onChange);
  };
}

export function resolveTheme(theme: Theme, systemTheme: ResolvedTheme): ResolvedTheme {
  return theme === "system" ? systemTheme : theme;
}

// The stylesheet's dark variant keys on this class, so it is the whole of applying a theme.
export function applyResolvedTheme(resolvedTheme: ResolvedTheme): void {
  document.documentElement.classList.remove(...RESOLVED_THEME_VALUES);
  document.documentElement.classList.add(resolvedTheme);
}

// Grows the new theme out of the control that picked it. Without an origin, without view
// transitions, or for a reader who asked for less motion, the theme simply changes.
export function startThemeTransition(apply: () => void, origin: TransitionOrigin | undefined): void {
  const canAnimate = typeof document.startViewTransition === "function"
    && !window.matchMedia(REDUCED_MOTION_QUERY).matches;

  if (origin === undefined || !canAnimate) {
    apply();

    return;
  }

  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  ) * REVEAL_RADIUS_OVERSHOOT;

  document.documentElement.style.setProperty(TRANSITION_X_PROPERTY, `${origin.x}px`);
  document.documentElement.style.setProperty(TRANSITION_Y_PROPERTY, `${origin.y}px`);
  document.documentElement.style.setProperty(TRANSITION_RADIUS_PROPERTY, `${radius}px`);
  document.startViewTransition(apply);
}
