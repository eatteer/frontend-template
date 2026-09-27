import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { buildErrorReport, copyErrorReport, describeError } from "@/common/lib/error-report";

import { buildApiError } from "@test/builders/api-error.builder";

describe("describeError", () => {
  it("uses the server's words for an APIError", () => {
    expect(describeError(buildApiError())).toEqual({ title: "Conflict", detail: "The email is already registered" });
  });

  it("says something generic for anything else, since its message is for developers", () => {
    expect(describeError(new TypeError("x is undefined")).title).toBe("Something went wrong");
  });
});

describe("buildErrorReport", () => {
  it("reports an APIError in full", () => {
    const error = buildApiError();

    expect(buildErrorReport(error)).toEqual(error.toReport());
  });

  it("reports what little an unexpected error has", () => {
    expect(buildErrorReport(new TypeError("x is undefined"))).toMatchObject({ name: "TypeError", message: "x is undefined" });
    expect(buildErrorReport("thrown string")).toMatchObject({ name: "string", message: "thrown string" });
  });
});

describe("copyErrorReport", () => {
  it("puts the report on the clipboard as JSON", async () => {
    userEvent.setup();

    const error = buildApiError();

    await copyErrorReport(error);

    expect(JSON.parse(await navigator.clipboard.readText())).toEqual(error.toReport());
  });
});
