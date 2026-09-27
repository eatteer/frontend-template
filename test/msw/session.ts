import { http, HttpResponse } from "msw";

import type { ProblemDetailsDto, SessionDto } from "@/common/api/schema.gen";

import { buildSessionDto } from "@test/builders/session.builder";
import { API_URL, problem } from "@test/msw/api";

import type { HttpHandler } from "msw";

export const SESSION_URL = `${API_URL}/auth/session`;
export const LOGIN_URL = `${API_URL}/auth/login`;
export const REFRESH_URL = `${API_URL}/auth/refresh`;
export const LOGOUT_URL = `${API_URL}/auth/logout`;
export const PREFERENCES_URL = `${API_URL}/users/me/preferences`;

export function unauthenticated(): HttpResponse<ProblemDetailsDto> {
  return problem({ status: 401, title: "Unauthorized", detail: "Authentication is required", code: "common.unauthenticated" });
}

export function signedIn(session: SessionDto = buildSessionDto()): HttpHandler {
  return http.get(SESSION_URL, (): HttpResponse<{ data: SessionDto }> => HttpResponse.json({ data: session }));
}

// Nobody signed in: no access cookie, and no refresh cookie to get one with.
export function signedOut(): HttpHandler[] {
  return [
    http.get(SESSION_URL, unauthenticated),
    http.post(REFRESH_URL, unauthenticated),
  ];
}
