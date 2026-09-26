import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RouteError } from "@/common/components/route-error";
import { handleCaughtError } from "@/common/lib/caught-error";
import { createQueryClient } from "@/common/query/query-client";

import { buildApiError } from "@test/builders/api-error.builder";

import type { JSX } from "react";

// A route whose loader fails the first time and succeeds after, so a retry has something to find.
function renderFailingRoute(): void {
  let attempts = 0;
  const rootRoute = createRootRoute();

  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    loader: (): void => {
      attempts += 1;

      if (attempts === 1) {
        throw buildApiError({ status: 503, title: "Service Unavailable", detail: "Try again later" });
      }
    },
    component: (): JSX.Element => <h1>Loaded</h1>,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    defaultErrorComponent: RouteError,
  });

  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
    { onCaughtError: handleCaughtError },
  );
}

describe("RouteError", () => {
  it("shows why the route failed and loads it again on retry", async () => {
    const user = userEvent.setup();
    // Outside production the router warns about every route that failed. Expected here, so it is
    // asserted rather than left to fail the test through the console guard.
    const warn = vi.spyOn(console, "warn").mockImplementation((): void => {});

    renderFailingRoute();

    expect(await screen.findByRole("alert")).toHaveTextContent("Try again later");

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Loaded" })).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Error in route match"));
  });
});
