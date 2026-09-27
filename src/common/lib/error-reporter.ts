import { ApiError } from "@/common/api/api-error";
import { ForbiddenError } from "@/common/lib/forbidden-error";

// Where an error surfaced: an error boundary caught it while rendering, a query or mutation threw
// something other than the server's answer, or nothing caught it at all.
export type ErrorSource = "boundary" | "query" | "uncaught" | "unhandled-rejection";

// The port every unexpected error goes through. A provider (Sentry, Datadog, an endpoint of your
// own) is one implementation of it, installed with `setErrorReporter` before the first render.
export type ErrorReporter = (error: unknown, source: ErrorSource) => void;

// No provider: the error goes to the console of whoever is looking, which is where the browser would
// have written it anyway. It is also what fails the test suites, which treat any console error as one.
export const consoleErrorReporter: ErrorReporter = (error: unknown, source: ErrorSource): void => {
  // eslint-disable-next-line no-console -- the reporter of last resort, when no provider is installed.
  console.error(`Unexpected error (${source}):`, error);
};

let reporter: ErrorReporter = consoleErrorReporter;

export function setErrorReporter(next: ErrorReporter): void {
  reporter = next;
}

// A failed request is the server's answer, and a refused route is a reader without a permission: the
// screen shows both, and neither is a bug. Everything else is one.
export function isExpectedError(error: unknown): boolean {
  return error instanceof ApiError || error instanceof ForbiddenError;
}

export function reportUnexpectedError(error: unknown, source: ErrorSource): void {
  if (isExpectedError(error)) {
    return;
  }

  reporter(error, source);
}

// What no boundary, no query and no handler caught. The browser's own console line is suppressed,
// so each error is reported exactly once, through the port.
export function reportUncaughtErrors(target: Window = window): () => void {
  const onError = (event: ErrorEvent): void => {
    event.preventDefault();
    reportUnexpectedError(event.error ?? event.message, "uncaught");
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
    event.preventDefault();
    reportUnexpectedError(event.reason, "unhandled-rejection");
  };

  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onUnhandledRejection);

  return (): void => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
