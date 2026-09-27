import { afterEach, describe, expect, it, vi } from "vitest";

import {
  consoleErrorReporter,
  reportUncaughtErrors,
  reportUnexpectedError,
  setErrorReporter,
} from "@/common/lib/error-reporter";
import { ForbiddenError } from "@/common/lib/forbidden-error";

import { buildApiError } from "@test/builders/api-error.builder";

describe("reportUnexpectedError", () => {
  it("hands a bug to the installed reporter, with where it surfaced", () => {
    const report = vi.fn();
    const bug = new TypeError("x is undefined");

    setErrorReporter(report);
    reportUnexpectedError(bug, "query");

    expect(report).toHaveBeenCalledWith(bug, "query");
  });

  it("reports an error once, however many places it surfaces from", () => {
    const report = vi.fn();
    const bug = new TypeError("y is undefined");

    setErrorReporter(report);
    reportUnexpectedError(bug, "query");
    reportUnexpectedError(bug, "boundary");

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(bug, "query");
  });

  it("leaves out the server's answers and refused routes, which the screen already shows", () => {
    const report = vi.fn();

    setErrorReporter(report);
    reportUnexpectedError(buildApiError(), "boundary");
    reportUnexpectedError(new ForbiddenError(), "boundary");

    expect(report).not.toHaveBeenCalled();
  });

  it("writes to the console when no provider is installed", () => {
    const error = vi.spyOn(console, "error").mockImplementation((): void => undefined);
    const bug = new TypeError("x is undefined");

    consoleErrorReporter(bug, "uncaught");

    expect(error).toHaveBeenCalledWith("Unexpected error (uncaught):", bug);

    error.mockRestore();
  });
});

describe("reportUncaughtErrors", () => {
  let stop: () => void = (): void => undefined;

  afterEach(() => {
    stop();
  });

  it("reports an error nothing caught, once, instead of the browser's own line", () => {
    const report = vi.fn();
    const bug = new TypeError("x is undefined");
    const event = new ErrorEvent("error", { error: bug, message: bug.message, cancelable: true });

    setErrorReporter(report);

    stop = reportUncaughtErrors();

    window.dispatchEvent(event);

    expect(report).toHaveBeenCalledWith(bug, "uncaught");
    expect(event.defaultPrevented).toBe(true);
  });

  it("falls back to the message when the event carries no error", () => {
    const report = vi.fn();

    setErrorReporter(report);

    stop = reportUncaughtErrors();

    window.dispatchEvent(new ErrorEvent("error", { message: "Script error." }));

    expect(report).toHaveBeenCalledWith("Script error.", "uncaught");
  });

  it("reports a rejection nobody handled", () => {
    const report = vi.fn();
    const bug = new Error("nobody awaited this");
    const event = new Event("unhandledrejection", { cancelable: true });

    Object.assign(event, { reason: bug });
    setErrorReporter(report);

    stop = reportUncaughtErrors();

    window.dispatchEvent(event);

    expect(report).toHaveBeenCalledWith(bug, "unhandled-rejection");
    expect(event.defaultPrevented).toBe(true);
  });

  it("stops listening when asked", () => {
    const report = vi.fn();

    // Vitest fails the run on an error event nobody prevented; this one stands in for the browser.
    const swallow = (event: ErrorEvent): void => {
      event.preventDefault();
    };

    setErrorReporter(report);
    reportUncaughtErrors()();
    window.addEventListener("error", swallow);
    window.dispatchEvent(new ErrorEvent("error", { error: new Error("late"), cancelable: true }));
    window.removeEventListener("error", swallow);

    expect(report).not.toHaveBeenCalled();
  });
});
