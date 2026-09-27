import { reportUnexpectedError } from "@/common/lib/error-reporter";

// React hands every error an error boundary caught to this, and by default writes it to the console.
// The boundary already shows it; what is left is to report the ones that are bugs.
export function handleCaughtError(error: unknown): void {
  reportUnexpectedError(error, "boundary");
}
