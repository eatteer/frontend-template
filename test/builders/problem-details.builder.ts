import type { ProblemDetailsDTO } from "@/common/api/schema.gen";

export function buildProblemDetails(overrides: Partial<ProblemDetailsDTO> = {}): ProblemDetailsDTO {
  return {
    type: "about:blank",
    title: "Conflict",
    status: 409,
    detail: "The email is already registered",
    instance: "/api/v1/users",
    code: "users.email_already_registered",
    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
    errors: [],
    ...overrides,
  };
}
