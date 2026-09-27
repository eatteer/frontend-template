import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ApiError, NETWORK_ERROR_CODE, NO_RESPONSE_STATUS, UNEXPECTED_RESPONSE_CODE } from "@/common/api/api-error";
import { apiClient, LANGUAGE_HEADER, RETRY_AFTER_HEADER, TRACE_ID_HEADER } from "@/common/api/client";
import { unwrapPage } from "@/common/api/pagination";
import { PROBLEM_DETAILS_MEDIA_TYPE } from "@/common/api/problem-details";
import type { ProblemDetailsDto, UserDto } from "@/common/api/schema.gen";
import { TRACEPARENT_HEADER, traceIdOf } from "@/common/api/traceparent";
import { changeLanguage } from "@/common/i18n/i18n";

import { buildPageDto } from "@test/builders/page.builder";
import type { PageDto } from "@test/builders/page.builder";
import { buildProblemDetails } from "@test/builders/problem-details.builder";
import { problem } from "@test/msw/api";
import { server } from "@test/msw/server";
import { USERS_URL } from "@test/msw/users";

const RESPONSE_TRACE_ID = "0af7651916cd43dd8448eb211c80319c";
const RETRY_AFTER_SECONDS = 30;

const EMPTY_PAGE = buildPageDto<UserDto>();

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
    server.use(http.get(USERS_URL, (): HttpResponse<PageDto<UserDto>> => HttpResponse.json(EMPTY_PAGE)));

    await expect(listUsers()).resolves.toEqual({ items: [], pagination: EMPTY_PAGE.pagination });
  });

  it("sends the session cookies, the reader's language and a trace context", async () => {
    let received: Request | undefined;

    server.use(http.get(USERS_URL, ({ request }: { request: Request }): HttpResponse<PageDto<UserDto>> => {
      received = request;

      return HttpResponse.json(EMPTY_PAGE);
    }));

    await changeLanguage("es");

    await listUsers();

    expect(received?.credentials).toBe("include");
    expect(received?.headers.get(LANGUAGE_HEADER)).toBe("es");
    expect(received?.headers.get(TRACEPARENT_HEADER)).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("turns Problem Details into an ApiError carrying all of it", async () => {
    const details = buildProblemDetails({
      status: 400,
      code: "common.validation_error",
      errors: [{ field: "email", message: "Invalid email" }],
    });

    server.use(http.get(USERS_URL, (): HttpResponse<ProblemDetailsDto> => problem(details, { [TRACE_ID_HEADER]: RESPONSE_TRACE_ID })));

    const error = await captureError();

    expect(error).toMatchObject({
      method: "GET",
      url: USERS_URL,
      status: 400,
      code: "common.validation_error",
      title: details.title,
      detail: details.detail,
      fieldErrors: [{ field: "email", message: "Invalid email" }],
      traceId: RESPONSE_TRACE_ID,
      retryAfterSeconds: undefined,
    });
  });

  it("reads how long to wait from a 429", async () => {
    server.use(http.get(USERS_URL, (): HttpResponse<ProblemDetailsDto> => problem(
      { status: 429 },
      { [RETRY_AFTER_HEADER]: String(RETRY_AFTER_SECONDS) },
    )));

    const error = await captureError();

    expect(error.retryAfterSeconds).toBe(RETRY_AFTER_SECONDS);
    expect(error.traceId).toBe(buildProblemDetails().traceId);
  });

  it("keeps the status of an answer that is not Problem Details", async () => {
    let sentTraceparent: string | null = null;

    server.use(http.get(USERS_URL, ({ request }: { request: Request }): HttpResponse<string> => {
      sentTraceparent = request.headers.get(TRACEPARENT_HEADER);

      return new HttpResponse("<html>Bad gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } });
    }));

    const error = await captureError();

    expect(error).toMatchObject({ status: 502, code: UNEXPECTED_RESPONSE_CODE, title: "Unexpected response", fieldErrors: [] });
    expect(error.traceId).toBe(traceIdOf(sentTraceparent));
  });

  it("treats a malformed Problem Details body as an unexpected answer", async () => {
    server.use(http.get(USERS_URL, (): HttpResponse<string> => new HttpResponse("{not json", {
      status: 500,
      headers: { "Content-Type": PROBLEM_DETAILS_MEDIA_TYPE },
    })));

    expect((await captureError()).code).toBe(UNEXPECTED_RESPONSE_CODE);
  });

  it("turns a request that got no answer into an ApiError with the trace it started", async () => {
    server.use(http.get(USERS_URL, (): Response => HttpResponse.error()));

    const error = await captureError();

    expect(error).toMatchObject({ status: NO_RESPONSE_STATUS, code: NETWORK_ERROR_CODE, title: "No connection" });
    expect(error.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(error.cause).toBeInstanceOf(Error);
  });
});
