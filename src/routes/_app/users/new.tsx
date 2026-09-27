import { createFileRoute } from "@tanstack/react-router";

import { requirePermissions } from "@/features/auth/api/session-guards";
import type { SignedInContext } from "@/features/auth/api/session-guards";
import { CreateUserPage } from "@/features/users/pages/create-user-page";

export const Route = createFileRoute("/_app/users/new")({
  beforeLoad: ({ context }: { context: SignedInContext }): void => {
    requirePermissions(context.session, ["users:create"]);
  },
  component: CreateUserPage,
});
