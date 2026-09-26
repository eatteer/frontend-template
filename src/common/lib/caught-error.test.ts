import { afterEach, describe, expect, it, vi } from "vitest";

import { handleCaughtError } from "@/common/lib/caught-error";
import { ForbiddenError } from "@/common/lib/forbidden-error";

import { buildApiError } from "@test/builders/api-error.builder";

describe("handleCaughtError", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stays quiet about a failed request the screen already shows", () => {
    const report = vi.fn();

    vi.stubGlobal("reportError", report);
    handleCaughtError(buildApiError());

    expect(report).not.toHaveBeenCalled();
  });

  it("stays quiet about a route refusing a reader without the permission", () => {
    const report = vi.fn();

    vi.stubGlobal("reportError", report);
    handleCaughtError(new ForbiddenError());

    expect(report).not.toHaveBeenCalled();
  });

  it("reports anything else as the bug it is", () => {
    const report = vi.fn();
    const bug = new TypeError("x is undefined");

    vi.stubGlobal("reportError", report);
    handleCaughtError(bug);

    expect(report).toHaveBeenCalledWith(bug);
  });
});
