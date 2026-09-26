import { queryOptions } from "@tanstack/react-query";

import { ApiError, UNAUTHORIZED_STATUS } from "@/common/api/api-error";
import { apiClient } from "@/common/api/client";
import { unwrap } from "@/common/api/envelope";
import { toSession } from "@/features/auth/api/session.mapper";
import type { Session } from "@/features/auth/model/session";

// `null` rather than `undefined` for nobody signed in: a query cannot resolve to `undefined`.
async function fetchSession(signal: AbortSignal): Promise<Session | null> {
  try {
    return toSession(unwrap(await apiClient.GET("/api/v1/auth/session", { signal })));
  } catch (error: unknown) {
    // Reached only once the refresh has been refused too, so this is an answer, not a failure.
    if (error instanceof ApiError && error.status === UNAUTHORIZED_STATUS) {
      return null;
    }

    throw error;
  }
}

// One session per tab, so a single query rather than a factory of them.
export const sessionQuery = queryOptions({
  queryKey: ["auth", "session"],
  queryFn: ({ signal }: { signal: AbortSignal }): Promise<Session | null> => fetchSession(signal),
  // It changes only with a sign-in, a sign-out or a refresh, and each of those updates it.
  staleTime: Number.POSITIVE_INFINITY,
});
