import { createFileRoute } from "@tanstack/react-router";

import { userQueries } from "@/features/users/api/user-queries";
import { UserDetailPage, UserDetailPageSkeleton } from "@/features/users/pages/user-detail-page";
import type { RouterContext } from "@/router";

// Loaded before the page renders, so the page reads the user with `useSuspenseQuery` and never
// handles a pending state; the skeleton shows only if the load takes long enough to notice. A user
// that does not exist fails the loader with a 404, which the route's error component shows.
export const Route = createFileRoute("/_app/users/$id/")({
  loader: async ({ context, params }: { context: RouterContext; params: { id: string } }): Promise<void> => {
    await context.queryClient.ensureQueryData(userQueries.detail(params.id));
  },
  pendingComponent: UserDetailPageSkeleton,
  component: UserDetailPage,
});
