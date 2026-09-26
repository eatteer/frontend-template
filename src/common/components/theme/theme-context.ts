import { createContext, useContext } from "react";

import type { ResolvedTheme, Theme, TransitionOrigin } from "@/common/components/theme/theme";

export type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme, origin?: TransitionOrigin) => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }

  return context;
}
