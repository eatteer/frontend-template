import { http, HttpResponse } from "msw";

import type { ProblemDetailsDTO, SessionDTO } from "@/common/api/schema.gen";

import { buildProblemDetails } from "@test/builders/problem-details.builder";
import { buildSessionDTO } from "@test/builders/session.builder";

import type { HttpHandler } from "msw";

export const SESSION_URL = "http://api.test/api/v1/auth/session";
export const LOGIN_URL = "http://api.test/api/v1/auth/login";
export const REFRESH_URL = "http://api.test/api/v1/auth/refresh";
export const LOGOUT_URL = "http://api.test/api/v1/auth/logout";
export const PREFERENCES_URL = "http://api.test/api/v1/users/me/preferences";

export function unauthenticated(): HttpResponse<ProblemDetailsDTO> {
  return HttpResponse.json(
    buildProblemDetails({ status: 401, title: "Unauthorized", detail: "Authentication is required", code: "common.unauthenticated" }),
    { status: 401, headers: { "Content-Type": "application/problem+json" } },
  );
}

export function signedIn(session: SessionDTO = buildSessionDTO()): HttpHandler {
  return http.get(SESSION_URL, () => HttpResponse.json({ data: session }));
}

// Nobody signed in: no access cookie, and no refresh cookie to get one with.
export function signedOut(): HttpHandler[] {
  return [
    http.get(SESSION_URL, unauthenticated),
    http.post(REFRESH_URL, unauthenticated),
  ];
}
