import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { subscribeToSessionEvents } from "@/common/api/session-events";
import type { SessionEvent } from "@/common/api/session-events";
import { sessionQuery } from "@/features/auth/api/session-queries";

import type { QueryClient } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";

const SIGN_IN_PATH = "/sign-in";

// Every way a session ends comes through here: the reader signing out, the refresh token refused,
// another tab signing out. The session is emptied first, so the sign-in page's guard does not send
// the reader straight back; the rest of the cache only after the page is left, so the screen going
// away does not refetch what was just removed. Nothing of the previous account survives for the next.
async function leaveSession(queryClient: QueryClient, router: AnyRouter, redirect: string | undefined): Promise<void> {
  const sessionKey = sessionQuery.queryKey;

  // Nothing to leave. A visitor's first request, refused all the way down to the refresh, ends in
  // this same event, and so does another tab's sign-out seen from the sign-in page.
  if (!queryClient.getQueryData(sessionKey)) {
    return;
  }

  queryClient.setQueryData(sessionKey, null);

  await router.navigate({ to: SIGN_IN_PATH, search: { redirect } });

  queryClient.clear();
  queryClient.setQueryData(sessionKey, null);
}

// Another tab signed in: this one learns the session, and if it is sitting on the sign-in page, its
// guard sends it where it was going. Fetched rather than reset, so a read already under way is
// joined instead of cancelled under whoever is waiting for it.
async function enterSession(queryClient: QueryClient, router: AnyRouter): Promise<void> {
  await queryClient.fetchQuery({ ...sessionQuery, staleTime: 0 });
  await router.invalidate();
}

// Keeps what this tab believes about the session in step with the cookies, which every tab shares.
export function SessionSync(): null {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => subscribeToSessionEvents((event: SessionEvent, isRemote: boolean): void => {
    switch (event.type) {
      case "refreshed":
        // New permissions and a new expiry. Not cancelling a fetch already under way: that one is
        // the request that triggered the refresh, and it will come back with the new session.
        void queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey }, { cancelRefetch: false });

        return;
      case "updated":
        // This tab's own change is already in its cache. Not cancelling a read under way either: a
        // route guard may be waiting on it, and it returns the stored change all the same.
        if (isRemote) {
          void queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey }, { cancelRefetch: false });
        }

        return;
      case "signed-in":
        // This tab's own sign-in navigates by itself.
        if (isRemote) {
          void enterSession(queryClient, router);
        }

        return;

      case "signed-out": {
        // Choosing to sign out is choosing to leave the page. Losing the session any other way —
        // expiry, another tab — should bring the reader back to it once they sign in again.
        const redirect = event.reason === "sign-out" && !isRemote ? undefined : router.state.location.href;

        void leaveSession(queryClient, router, redirect);
      }
    }
  }), [queryClient, router]);

  return null;
}
