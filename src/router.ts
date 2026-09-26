import { createRouter } from "@tanstack/react-router";

import { NotFound } from "@/common/components/not-found";
import { RouteError } from "@/common/components/route-error";
import { routeTree } from "@/routeTree.gen";

import type { QueryClient } from "@tanstack/react-query";
import type { RouterHistory } from "@tanstack/react-router";

export type RouterContext = {
  queryClient: QueryClient;
};

// `history` is the browser's unless a test passes an in-memory one.
export function createAppRouter(
  queryClient: QueryClient,
  history?: RouterHistory,
): ReturnType<typeof createRouter<typeof routeTree>> {
  return createRouter({
    routeTree,
    history,
    context: { queryClient },
    defaultPreload: "intent",
    // The query cache decides freshness; the router's own cache would only hold on to a copy of it.
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
