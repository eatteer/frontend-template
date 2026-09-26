import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ApiError, NETWORK_ERROR_CODE, NO_RESPONSE_STATUS, UNEXPECTED_RESPONSE_CODE } from "@/common/api/api-error";
import { apiClient } from "@/common/api/client";
import { unwrapPage } from "@/common/api/pagination";
import { traceIdOf } from "@/common/api/traceparent";
import { changeLanguage } from "@/common/i18n/i18n";

import { buildProblemDetails } from "@test/builders/problem-details.builder";
import { server } from "@test/msw/server";

const USERS_URL = "http://api.test/api/v1/users";
const RESPONSE_TRACE_ID = "0af7651916cd43dd8448eb211c80319c";

const EMPTY_PAGE = {
  data: [],
  pagination: { total: 0, pages: 0, page: 1, limit: 10, next: null, previous: null },
};

async function listUsers(): Promise<unknown> {
  return unwrapPage(await apiClient.GET("/api/v1/users"));
}

async function captureError(): Promise<ApiError> {
  try {
    await listUsers();
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return error;
    }

    throw error;
  }

  throw new Error("The request was expected to fail");
}

describe("apiClient", () => {
  it("unwraps a successful answer", async () => {
    server.use(http.get(USERS_URL, () => HttpResponse.json(EMPTY_PAGE)));

    await expect(listUsers()).resolves.toEqual({ items: [], pagination: EMPTY_PAGE.pagination });
  });

  it("sends the session cookies, the reader's language and a trace context", async () => {
    let received: Request | undefined;

    server.use(http.get(USERS_URL, ({ request }: { request: Request }) => {
      received = request;

      return HttpResponse.json(EMPTY_PAGE);
    }));

    await changeLanguage("es");
    await listUsers();

    expect(received?.credentials).toBe("include");
    expect(received?.headers.get("x-lang")).toBe("es");
    expect(received?.headers.get("traceparent")).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("turns Problem Details into an ApiError carrying all of it", async () => {
    const problem = buildProblemDetails({
      status: 400,
      code: "common.validation_error",
      errors: [{ field: "email", message: "Invalid email" }],
    });

    server.use(http.get(USERS_URL, () => HttpResponse.json(problem, {
      status: 400,
      headers: { "Content-Type": "application/problem+json", "x-trace-id": RESPONSE_TRACE_ID },
    })));

    const error = await captureError();

    expect(error).toMatchObject({
      method: "GET",
      url: USERS_URL,
      status: 400,
      code: "common.validation_error",
      title: problem.title,
      detail: problem.detail,
      fieldErrors: [{ field: "email", message: "Invalid email" }],
      traceId: RESPONSE_TRACE_ID,
      retryAfterSeconds: undefined,
    });
  });

  it("reads how long to wait from a 429", async () => {
    server.use(http.get(USERS_URL, () => HttpResponse.json(buildProblemDetails({ status: 429 }), {
      status: 429,
      headers: { "Content-Type": "application/problem+json", "Retry-After": "30" },
    })));

    const error = await captureError();

    expect(error.retryAfterSeconds).toBe(30);
    expect(error.traceId).toBe(buildProblemDetails().traceId);
  });

  it("keeps the status of an answer that is not Problem Details", async () => {
    let sentTraceparent: string | null = null;

    server.use(http.get(USERS_URL, ({ request }: { request: Request }) => {
      sentTraceparent = request.headers.get("traceparent");

      return new HttpResponse("<html>Bad gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } });
    }));

    const error = await captureError();

    expect(error).toMatchObject({ status: 502, code: UNEXPECTED_RESPONSE_CODE, title: "Unexpected response", fieldErrors: [] });
    expect(error.traceId).toBe(traceIdOf(sentTraceparent));
  });

  it("treats a malformed Problem Details body as an unexpected answer", async () => {
    server.use(http.get(USERS_URL, () => new HttpResponse("{not json", {
      status: 500,
      headers: { "Content-Type": "application/problem+json" },
    })));

    expect((await captureError()).code).toBe(UNEXPECTED_RESPONSE_CODE);
  });

  it("turns a request that got no answer into an ApiError with the trace it started", async () => {
    server.use(http.get(USERS_URL, () => HttpResponse.error()));

    const error = await captureError();

    expect(error).toMatchObject({ status: NO_RESPONSE_STATUS, code: NETWORK_ERROR_CODE, title: "No connection" });
    expect(error.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(error.cause).toBeInstanceOf(Error);
  });
});
