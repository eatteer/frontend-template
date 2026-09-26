import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

import { SessionSync } from "@/features/auth/components/session-sync";
import type { RouterContext } from "@/router";

import type { JSX } from "react";

export const Route = createRootRouteWithContext<RouterContext>()({
  // SessionSync at the root, so it listens on every page — the sign-in page included, which is
  // where another tab's sign-in has to reach.
  component: (): JSX.Element => (
    <>
      <Outlet />
      <SessionSync />
    </>
  ),
});
