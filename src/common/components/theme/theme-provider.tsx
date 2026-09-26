import { useEffect, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import {
  applyResolvedTheme,
  getSystemTheme,
  readStoredTheme,
  resolveTheme,
  startThemeTransition,
  subscribeToSystemTheme,
  THEME_STORAGE_KEY,
} from "@/common/components/theme/theme";
import type { Theme, TransitionOrigin } from "@/common/components/theme/theme";
import { ThemeContext } from "@/common/components/theme/theme-context";

import type { JSX, ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme);
  const resolvedTheme = resolveTheme(theme, systemTheme);

  // Keeps the class in step when the system theme changes under a reader who follows it.
  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  function setTheme(nextTheme: Theme, origin?: TransitionOrigin): void {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

    // The view transition snapshots the page when the callback returns, so the new theme has to be
    // on the DOM by then — rendered synchronously, and the class applied without waiting for effects.
    startThemeTransition(() => {
      flushSync(() => {
        setThemeState(nextTheme);
      });

      applyResolvedTheme(resolveTheme(nextTheme, getSystemTheme()));
    }, origin);
  }

  return (
    <ThemeContext value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext>
  );
}
