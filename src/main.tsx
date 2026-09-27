import "@/common/config/zod";
import "@/styles.css";
import "@/common/i18n/i18n";

import { CSPProvider } from "@base-ui/react/csp-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppToaster } from "@/common/components/app-toaster";
import { FullscreenLoader } from "@/common/components/fullscreen-loader";
import { applyResolvedTheme, getSystemTheme, readStoredTheme, resolveTheme } from "@/common/components/theme/theme";
import { ThemeProvider } from "@/common/components/theme/theme-provider";
import { handleCaughtError } from "@/common/lib/caught-error";
import { reportUncaughtErrors } from "@/common/lib/error-reporter";
import { reloadOnPreloadError } from "@/common/lib/preload-error";
import { reportWebVitals } from "@/common/lib/web-vitals";
import { createQueryClient } from "@/common/query/query-client";
import { createAppRouter } from "@/router";

const rootElement = document.getElementById("root");

if (!rootElement) { throw new Error("index.html has no #root element to mount the application into"); }

// Before the first render, so a dark theme never flashes light while React starts.
applyResolvedTheme(resolveTheme(readStoredTheme(), getSystemTheme()));
reportUncaughtErrors();
reportWebVitals();
reloadOnPreloadError();

const queryClient = createQueryClient();
const router = createAppRouter(queryClient);

// The CSP settings outermost, since any primitive may read them: Base UI renders no inline <style>
// element, which the Content-Security-Policy would refuse, and styles.css carries its rule instead.
// Then the theme, since everything paints with it; the query client around the router, whose loaders
// read through it; the toaster and the loader beside the router, so a route change never unmounts
// them.
createRoot(rootElement, { onCaughtError: handleCaughtError }).render(
  <StrictMode>
    <CSPProvider disableStyleElements>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <FullscreenLoader />
          <AppToaster />
        </QueryClientProvider>
      </ThemeProvider>
    </CSPProvider>
  </StrictMode>,
);
