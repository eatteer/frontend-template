import { describe, expect, it, vi } from "vitest";

import { handleCaughtError } from "@/common/lib/caught-error";
import { setErrorReporter } from "@/common/lib/error-reporter";
import { ForbiddenError } from "@/common/lib/forbidden-error";

import { buildApiError } from "@test/builders/api-error.builder";

describe("handleCaughtError", () => {
  it("stays quiet about a failed request the screen already shows", () => {
    const report = vi.fn();

    setErrorReporter(report);
    handleCaughtError(buildApiError());

    expect(report).not.toHaveBeenCalled();
  });

  it("stays quiet about a route refusing a reader without the permission", () => {
    const report = vi.fn();

    setErrorReporter(report);
    handleCaughtError(new ForbiddenError());

    expect(report).not.toHaveBeenCalled();
  });

  it("reports anything else as the bug it is", () => {
    const report = vi.fn();
    const bug = new TypeError("x is undefined");

    setErrorReporter(report);
    handleCaughtError(bug);

    expect(report).toHaveBeenCalledWith(bug, "boundary");
  });
});
