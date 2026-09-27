import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";

import { AppToaster } from "@/common/components/app-toaster";
import { FullscreenLoader } from "@/common/components/fullscreen-loader";
import { ThemeProvider } from "@/common/components/theme/theme-provider";
import { handleCaughtError } from "@/common/lib/caught-error";
import { createQueryClient } from "@/common/query/query-client";
import { createAppRouter } from "@/router";

import type { QueryClient } from "@tanstack/react-query";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";

type Rendered = RenderResult & { queryClient: QueryClient };

// A fresh query client per test, so no cached answer leaks from one test into the next.
export function renderWithProviders(ui: ReactNode, queryClient: QueryClient = createQueryClient()): Rendered {
  const rendered = render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {ui}
        <FullscreenLoader />
        <AppToaster />
      </QueryClientProvider>
    </ThemeProvider>,
    // The same handler as the application root, so a test sees what a reader's console would.
    { onCaughtError: handleCaughtError },
  );

  return { ...rendered, queryClient };
}

type RenderedRoute = Rendered & { router: ReturnType<typeof createAppRouter> };

// The whole application at a path, with the router it really uses.
export function renderRoute(path: string): RenderedRoute {
  const queryClient = createQueryClient();
  const router = createAppRouter(queryClient, createMemoryHistory({ initialEntries: [path] }));

  return { ...renderWithProviders(<RouterProvider router={router} />, queryClient), router };
}
