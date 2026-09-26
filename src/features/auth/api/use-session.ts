import { useQuery } from "@tanstack/react-query";

import { sessionQuery } from "@/features/auth/api/session-queries";
import { hasPermissions } from "@/features/auth/model/session";
import type { Permission, SessionUser } from "@/features/auth/model/session";

// Under the signed-in layout the session is already in the cache — its guard loaded it — so these
// answer on the first render, with no loading state to handle. They still allow for no session:
// signing out empties it a moment before the page is left.

export function useSessionUser(): SessionUser | undefined {
  const { data: session } = useQuery(sessionQuery);

  return session?.user;
}

// For what a component shows: a button, a menu item, a column. The route and the API check again,
// and the API is the only one of the three that protects anything.
export function useHasPermissions(required: readonly Permission[]): boolean {
  const { data: session } = useQuery(sessionQuery);

  return session !== undefined && session !== null && hasPermissions(session, required);
}
