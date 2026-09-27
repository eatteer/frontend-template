import { createFileRoute } from "@tanstack/react-router";

import { requirePermissions } from "@/features/auth/api/session-guards";
import { userQueries } from "@/features/users/api/user-queries";
import { EditUserPage, EditUserPageSkeleton } from "@/features/users/pages/edit-user-page";

// The form mounts once the user is loaded, with its values from the start.
export const Route = createFileRoute("/_app/users/$id/edit")({
  beforeLoad: ({ context }) => {
    requirePermissions(context.session, ["users:update"]);
  },
  loader: async ({ context, params }): Promise<void> => {
    await context.queryClient.ensureQueryData(userQueries.detail(params.id));
  },
  pendingComponent: EditUserPageSkeleton,
  component: EditUserPage,
});
