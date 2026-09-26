import { ApiError } from "@/common/api/api-error";

// React hands every error an error boundary caught to this, and by default writes it to the console.
// A failed request is not a bug: the boundary already shows it, with a report the reader can copy,
// so logging it again is noise. Anything else is a bug, and is reported as one.
export function handleCaughtError(error: unknown): void {
  if (error instanceof ApiError) {
    return;
  }

  reportError(error);
}
