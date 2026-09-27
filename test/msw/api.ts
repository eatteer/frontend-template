import { HttpResponse } from "msw";

import { PROBLEM_DETAILS_MEDIA_TYPE } from "@/common/api/problem-details";
import type { ProblemDetailsDTO } from "@/common/api/schema.gen";
import { env } from "@/common/config/env";

import { buildProblemDetails } from "@test/builders/problem-details.builder";

import type { DefaultBodyType } from "msw";

// The origin the tests run the application against (see vite.config.ts), with the API's prefix.
export const API_URL = `${env.VITE_API_URL}/api/v1`;

// What a handler that answers in more than one shape returns: the envelope, Problem Details, an empty
// body or no answer at all.
export type MockedResponse = HttpResponse<DefaultBodyType>;

// A failure as the backend answers it: Problem Details, with its content type and any other header
// the answer carries.
export function problem(overrides: Partial<ProblemDetailsDTO> = {}, headers: Record<string, string> = {}): HttpResponse<ProblemDetailsDTO> {
  const body = buildProblemDetails(overrides);

  return HttpResponse.json(body, { status: body.status, headers: { ...headers, "Content-Type": PROBLEM_DETAILS_MEDIA_TYPE } });
}
