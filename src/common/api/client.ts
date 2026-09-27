import createClient from "openapi-fetch";

import { ApiError, NETWORK_ERROR_CODE, NO_RESPONSE_STATUS, UNEXPECTED_RESPONSE_CODE } from "@/common/api/api-error";
import { parseProblemDetails, PROBLEM_DETAILS_MEDIA_TYPE } from "@/common/api/problem-details";
import type { paths } from "@/common/api/schema.gen";
import { createSessionRefreshMiddleware } from "@/common/api/session-refresh";
import { createTraceparent, TRACEPARENT_HEADER, traceIdOf } from "@/common/api/traceparent";
import { env } from "@/common/config/env";
import { i18n } from "@/common/i18n/i18n";

import type { Middleware } from "openapi-fetch";

const LANGUAGE_HEADER = "x-lang";
const TRACE_ID_HEADER = "x-trace-id";
const RETRY_AFTER_HEADER = "Retry-After";
const CONTENT_TYPE_HEADER = "Content-Type";

// Every request says which language its messages should come back in, and starts a trace the
// backend continues.
export const requestContextMiddleware: Middleware = {
  onRequest: ({ request }: { request: Request }): Request => {
    request.headers.set(LANGUAGE_HEADER, i18n.language);

    if (!request.headers.has(TRACEPARENT_HEADER)) {
      request.headers.set(TRACEPARENT_HEADER, createTraceparent());
    }

    return request;
  },
};

// Only the seconds form: the backend never sends the date form.
function parseRetryAfter(value: string | null): number | undefined {
  const seconds = Number(value ?? Number.NaN);

  return Number.isInteger(seconds) ? seconds : undefined;
}

async function readProblemDetails(response: Response): Promise<unknown> {
  if (!response.headers.get(CONTENT_TYPE_HEADER)?.startsWith(PROBLEM_DETAILS_MEDIA_TYPE)) {
    return undefined;
  }

  try {
    return await response.clone().json();
  } catch {
    return undefined;
  }
}

// A failed response becomes an ApiError thrown from the call, so a caller only ever sees data. An
// answer that is not Problem Details — a proxy's HTML error page — becomes one too, keeping the
// status it came with.
export const problemDetailsMiddleware: Middleware = {
  onResponse: async ({ request, response }: { request: Request; response: Response }): Promise<undefined> => {
    if (response.ok) {
      return undefined;
    }

    const problem = parseProblemDetails(await readProblemDetails(response));

    const context = {
      method: request.method,
      url: request.url,
      status: response.status,
      traceId: response.headers.get(TRACE_ID_HEADER)
        ?? problem?.traceId
        ?? traceIdOf(request.headers.get(TRACEPARENT_HEADER)),
      retryAfterSeconds: parseRetryAfter(response.headers.get(RETRY_AFTER_HEADER)),
    };

    if (problem === undefined) {
      throw new ApiError({
        ...context,
        code: UNEXPECTED_RESPONSE_CODE,
        title: i18n.t("errors.unexpected_response.title"),
        detail: i18n.t("errors.unexpected_response.detail"),
        fieldErrors: [],
      });
    }

    throw new ApiError({
      ...context,
      code: problem.code,
      title: problem.title,
      detail: problem.detail,
      fieldErrors: problem.errors,
    });
  },
  onError: ({ request, error }: { request: Request; error: unknown }): ApiError => new ApiError(
    {
      method: request.method,
      url: request.url,
      status: NO_RESPONSE_STATUS,
      code: NETWORK_ERROR_CODE,
      title: i18n.t("errors.network.title"),
      detail: i18n.t("errors.network.detail"),
      fieldErrors: [],
      traceId: traceIdOf(request.headers.get(TRACEPARENT_HEADER)),
      retryAfterSeconds: undefined,
    },
    { cause: error },
  ),
};

export const apiClient = createClient<paths>({
  baseUrl: env.VITE_API_URL,
  // The session travels in HttpOnly cookies, which a cross-origin request sends only when asked to.
  credentials: "include",
  // Looked up on every call rather than captured when the client is created, so whatever replaces
  // the global — a test's network mock — is the one used.
  fetch: (request: Request): Promise<Response> => globalThis.fetch(request),
});

// Response middlewares run in reverse order of registration, so the refresh — registered last — sees
// a 401 before it is turned into an ApiError, and can answer with the request sent again instead.
apiClient.use(
  requestContextMiddleware,
  problemDetailsMiddleware,
  createSessionRefreshMiddleware(() => apiClient.POST("/api/v1/auth/refresh", { body: {} })),
);
