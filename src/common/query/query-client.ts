import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { ApiError, UNAUTHORIZED_STATUS } from "@/common/api/api-error";
import { showErrorToast } from "@/common/components/error-toast";
import { reportUnexpectedError } from "@/common/lib/error-reporter";

import type { Mutation, Query } from "@tanstack/react-query";

export type QueryMeta = {
  // false for a query whose failure its screen already explains.
  errorToast?: boolean;
};

export type MutationMeta = {
  // false for a mutation whose caller shows the failure itself — a form mapping errors to fields.
  errorToast?: boolean;
  // false for a mutation the reader should not wait on — a background save, a toggle.
  fullscreenLoader?: boolean;
};

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
    queryMeta: QueryMeta;
    mutationMeta: MutationMeta;
  }
}

// Zero so a screen that mounts again goes back to the network: other people change this data, and
// a reader returning to a screen should see its current state. A query over data that cannot change
// sets its own, higher value.
const DEFAULT_STALE_TIME_MS = 0;

export const MAX_QUERY_RETRIES = 2;

// A 4xx describes the request, so repeating it only delays the same answer.
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.isClientError) {
    return false;
  }

  return failureCount < MAX_QUERY_RETRIES;
}

// A 401 reaches a caller only once the refresh was refused too, and by then the reader is on their
// way to sign in again: the sign-in page is the explanation, and a toast would only cover it.
function shouldToast(error: ApiError, meta: QueryMeta | MutationMeta | undefined): boolean {
  return error.status !== UNAUTHORIZED_STATUS && meta?.errorToast !== false;
}

// `defaultError` says ApiError, and that is what the transport throws. Anything else — a mapper
// reading a field the response lacks — is a bug in the query function, and is reported as one on top
// of the screen or toast the reader gets.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
    },
    queryCache: new QueryCache({
      // A query that never loaded shows its error in place of its content. Only a failed refetch
      // behind data already on screen would otherwise go unnoticed, so only that one toasts.
      onError: (error: ApiError, query: Query<unknown, unknown>): void => {
        reportUnexpectedError(error, "query");

        if (query.state.data !== undefined && shouldToast(error, query.meta)) {
          showErrorToast(error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (
        error: ApiError,
        _variables: unknown,
        _onMutateResult: unknown,
        mutation: Mutation<unknown, unknown, unknown>,
      ): void => {
        reportUnexpectedError(error, "query");

        if (shouldToast(error, mutation.meta)) {
          showErrorToast(error);
        }
      },
    }),
  });
}
