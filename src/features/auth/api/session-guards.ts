import { redirect } from "@tanstack/react-router";

import { ForbiddenError } from "@/common/lib/forbidden-error";
import { sessionQuery } from "@/features/auth/api/session-queries";
import { hasPermissions } from "@/features/auth/model/session";
import type { Permission, Session } from "@/features/auth/model/session";
import type { RouterContext } from "@/router";

import type { ParsedLocation } from "@tanstack/react-router";

// What every route below the signed-in layout reads from its context: the guard put the session there.
export type SignedInContext = RouterContext & { session: Session };

type GuardInput = {
  context: RouterContext;
  location: ParsedLocation;
};

// For the `beforeLoad` of the signed-in layout. Nobody signed in goes to sign in, and comes back to
// the page they asked for; a session is handed to every route below, whose guards read it from there.
export async function requireSession({ context, location }: GuardInput): Promise<{ session: Session }> {
  const session = await context.queryClient.ensureQueryData(sessionQuery);

  if (session === null) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- the router's control flow: a thrown redirect is how `beforeLoad` navigates.
    throw redirect({ to: "/sign-in", search: { redirect: location.href } });
  }

  return { session };
}

// For the `beforeLoad` of a route that needs permissions. Thrown before any loader runs, so nothing
// the reader may not see is ever requested; the route's error component explains the refusal.
export function requirePermissions(session: Session, required: readonly Permission[]): void {
  if (!hasPermissions(session, required)) {
    throw new ForbiddenError();
  }
}
