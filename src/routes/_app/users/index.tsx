import { createFileRoute } from "@tanstack/react-router";

import { UsersListPage } from "@/features/users/pages/users-list-page";
import { usersSearchSchema } from "@/features/users/schemas/users-search.schema";

// No loader: the list shows its skeleton in place while the page around it is already there.
export const Route = createFileRoute("/_app/users/")({
  validateSearch: usersSearchSchema,
  component: UsersListPage,
});
