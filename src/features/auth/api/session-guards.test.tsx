import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRouteWithContext, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RouteError } from "@/common/components/route-error";
import { createQueryClient } from "@/common/query/query-client";
import { requirePermissions, requireSession } from "@/features/auth/api/session-guards";
import type { SignedInContext } from "@/features/auth/api/session-guards";
import { useHasPermissions } from "@/features/auth/api/use-session";
import type { RouterContext } from "@/router";

import { buildApiError } from "@test/builders/api-error.builder";
import { buildSessionDTO } from "@test/builders/session.builder";
import { server } from "@test/msw/server";
import { signedIn } from "@test/msw/session";
import { renderWithProviders } from "@test/render";
import { expectRouteFailureWarning } from "@test/route-failure-warning";

import type { JSX, ReactNode } from "react";

// The shape of the application's tree, small enough to hold every case: a signed-in layout, a page
// behind a permission, and pages whose loaders the API refuses.
function renderGuardedRoute(path: string): void {
  const rootRoute = createRootRouteWithContext<RouterContext>()({ component: Outlet });

  const signInRoute = createRoute({
    getParentRoute: (): typeof rootRoute => rootRoute,
    path: "/sign-in",
    component: (): JSX.Element => <h1>Sign in</h1>,
  });

  const appRoute = createRoute({
    getParentRoute: (): typeof rootRoute => rootRoute,
    id: "app",
    beforeLoad: requireSession,
  });

  const usersRoute = createRoute({
    getParentRoute: (): typeof appRoute => appRoute,
    path: "/users",
    beforeLoad: ({ context }: { context: SignedInContext }): void => {
      requirePermissions(context.session, ["users:delete"]);
    },
    component: (): JSX.Element => <h1>Users</h1>,
  });

  const rolesRoute = createRoute({
    getParentRoute: (): typeof appRoute => appRoute,
    path: "/roles/$id",
    loader: (): never => {
      throw buildApiError({ status: 404 });
    },
    component: (): JSX.Element => <h1>Role</h1>,
  });

  const filesRoute = createRoute({
    getParentRoute: (): typeof appRoute => appRoute,
    path: "/files",
    loader: (): never => {
      throw buildApiError({ status: 403, code: "common.forbidden" });
    },
    component: (): JSX.Element => <h1>Files</h1>,
  });

  const queryClient = createQueryClient();

  const router = createRouter({
    routeTree: rootRoute.addChildren([signInRoute, appRoute.addChildren([usersRoute, rolesRoute, filesRoute])]),
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient },
    defaultErrorComponent: RouteError,
  });

  renderWithProviders(<RouterProvider router={router} />, queryClient);
}

describe("the route guards", () => {
  it("says plainly that a page needs a permission the reader lacks", async () => {
    const warning = expectRouteFailureWarning();

    renderGuardedRoute("/users");

    expect(await screen.findByText("You don't have access")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Users" })).not.toBeInTheDocument();

    warning.assertWarned();
  });

  it("opens the page to a reader who has the permission", async () => {
    server.use(signedIn(buildSessionDTO({ permissions: ["users:delete"] })));

    renderGuardedRoute("/users");

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
  });

  it("shows the same refusal when it is the API that refuses", async () => {
    const warning = expectRouteFailureWarning();

    renderGuardedRoute("/files");

    expect(await screen.findByText("You don't have access")).toBeInTheDocument();

    warning.assertWarned();
  });

  it("shows the not-found page for something the API says does not exist", async () => {
    const warning = expectRouteFailureWarning();

    renderGuardedRoute("/roles/missing");

    expect(await screen.findByText("Page not found")).toBeInTheDocument();

    warning.assertWarned();
  });
});

describe("useHasPermissions", () => {
  function wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  let queryClient = createQueryClient();

  beforeEach(() => {
    queryClient = createQueryClient();
  });

  it("answers from the session, and no until there is one", async () => {
    const { result, rerender } = renderHook(() => useHasPermissions(["users:create"]), { wrapper });

    expect(result.current).toBe(false);

    await vi.waitFor(() => {
      rerender();

      expect(result.current).toBe(true);
    });
  });
});
