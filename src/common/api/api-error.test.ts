import { describe, expect, it } from "vitest";

import { ApiError } from "@/common/api/api-error";

import { buildApiError, buildApiErrorInit } from "@test/builders/api-error.builder";

describe("ApiError", () => {
  it("is an Error, so it keeps a stack and a cause", () => {
    const cause = new TypeError("Failed to fetch");
    const error = new ApiError(buildApiErrorInit(), { cause });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe(error.detail);
    expect(error.stack).toBeDefined();
    expect(error.cause).toBe(cause);
  });

  it.each([
    [400, true],
    [404, true],
    [499, true],
    [0, false],
    [500, false],
    [503, false],
  ])("treats status %i as a client error: %s", (status: number, isClientError: boolean) => {
    expect(buildApiError({ status }).isClientError).toBe(isClientError);
  });

  it("reports everything someone debugging needs", () => {
    const error = buildApiError({ fieldErrors: [{ field: "email", message: "Invalid" }] });

    expect(error.toReport()).toEqual({
      method: "POST",
      url: "http://api.test/api/v1/users",
      status: 409,
      code: "users.email_already_registered",
      title: "Conflict",
      detail: "The email is already registered",
      errors: [{ field: "email", message: "Invalid" }],
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      timestamp: error.occurredAt.toISOString(),
    });
  });
});
