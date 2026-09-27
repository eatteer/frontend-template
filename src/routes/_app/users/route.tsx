import { createFileRoute } from "@tanstack/react-router";

import { requirePermissions } from "@/features/auth/api/session-guards";
import type { SignedInContext } from "@/features/auth/api/session-guards";

// Every users page needs to read them. The pages that change a user add their own permission.
export const Route = createFileRoute("/_app/users")({
  beforeLoad: ({ context }: { context: SignedInContext }): void => {
    requirePermissions(context.session, ["users:read"]);
  },
});
