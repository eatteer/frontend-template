import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/common/components/app-shell";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});
