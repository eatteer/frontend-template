import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { ErrorState } from "@/common/components/error-state";

import type { ErrorComponentProps } from "@tanstack/react-router";
import type { JSX } from "react";

// A route whose loader or component threw. Retrying clears the failed queries' error state and runs
// the route's loaders again, so the retry is a real one rather than a re-render of the same error.
export function RouteError({ error }: ErrorComponentProps): JSX.Element {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <ErrorState
      error={error}
      onRetry={() => {
        void router.invalidate();
      }}
    />
  );
}
