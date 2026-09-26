import { ApiError } from "@/common/api/api-error";
import { ForbiddenError } from "@/common/lib/forbidden-error";

// React hands every error an error boundary caught to this, and by default writes it to the console.
// A failed request is not a bug: the boundary already shows it, with a report the reader can copy,
// so logging it again is noise. Nor is a route refusing a reader who lacks a permission. Anything
// else is a bug, and is reported as one.
export function handleCaughtError(error: unknown): void {
  if (error instanceof ApiError || error instanceof ForbiddenError) {
    return;
  }

  reportError(error);
}
