import { ApiError } from "@/common/api/api-error";
import type { ApiErrorInit } from "@/common/api/api-error";

// What the backend's 409 turns into, with whatever a test needs to differ.
export function buildApiErrorInit(overrides: Partial<ApiErrorInit> = {}): ApiErrorInit {
  return {
    method: "POST",
    url: "http://api.test/api/v1/users",
    status: 409,
    code: "users.email_already_registered",
    title: "Conflict",
    detail: "The email is already registered",
    fieldErrors: [],
    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
    retryAfterSeconds: undefined,
    ...overrides,
  };
}

export function buildApiError(overrides: Partial<ApiErrorInit> = {}): ApiError {
  return new ApiError(buildApiErrorInit(overrides));
}
