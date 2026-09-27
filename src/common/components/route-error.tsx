import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { ApiError, FORBIDDEN_STATUS, NOT_FOUND_STATUS } from "@/common/api/api-error";
import { ErrorState } from "@/common/components/error-state";
import { Forbidden } from "@/common/components/forbidden";
import { NotFound } from "@/common/components/not-found";
import { ForbiddenError } from "@/common/lib/forbidden-error";

import type { ErrorComponentProps } from "@tanstack/react-router";
import type { JSX } from "react";

function isForbidden(error: unknown): boolean {
  return error instanceof ForbiddenError || (error instanceof ApiError && error.status === FORBIDDEN_STATUS);
}

// A route whose guard, loader or component threw. A refusal and a missing resource get the pages
// that say so, whether the route decided it or the API did. Anything else can be retried: that
// clears the failed queries' error state and runs the route's loaders again, so the retry is a real
// one rather than a re-render of the same error.
export function RouteError({ error }: ErrorComponentProps): JSX.Element {
  const router = useRouter();

  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  if (isForbidden(error)) {
    return <Forbidden />;
  }

  if (error instanceof ApiError && error.status === NOT_FOUND_STATUS) {
    return <NotFound />;
  }

  return (
    <ErrorState
      error={error}
      onRetry={() => {
        void router.invalidate();
      }}
    />
  );
}
