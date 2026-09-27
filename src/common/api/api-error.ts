import type { ProblemFieldErrorDTO } from "@/common/api/schema.gen";

export const NETWORK_ERROR_CODE = "client.network_error";
export const UNEXPECTED_RESPONSE_CODE = "client.unexpected_response";

// No HTTP status exists for a request that never got an answer; 0 is what `fetch` itself reports.
export const NO_RESPONSE_STATUS = 0;

export const UNAUTHORIZED_STATUS = 401;
export const FORBIDDEN_STATUS = 403;
export const NOT_FOUND_STATUS = 404;

const CLIENT_ERROR_MIN_STATUS = 400;
const SERVER_ERROR_MIN_STATUS = 500;

export type FieldError = ProblemFieldErrorDTO;

export type APIErrorInit = {
  method: string;
  url: string;
  status: number;
  code: string;
  title: string;
  detail: string;
  fieldErrors: FieldError[];
  traceId: string | undefined;
  retryAfterSeconds: number | undefined;
};

// Everything someone debugging needs, in one object a user can paste into a ticket.
export type ErrorReport = {
  method: string;
  url: string;
  status: number;
  code: string;
  title: string;
  detail: string;
  errors: FieldError[];
  traceId: string | undefined;
  timestamp: string;
};

// Every failed request becomes one of these: a Problem Details answer, an answer that is not one,
// or no answer at all. A real Error, so it keeps its stack and `cause`, and one type is all the
// query layer and the UI have to understand.
export class APIError extends Error {
  public override readonly name = "APIError";
  public readonly method: string;
  public readonly url: string;
  public readonly status: number;
  public readonly code: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly fieldErrors: FieldError[];
  public readonly traceId: string | undefined;
  public readonly retryAfterSeconds: number | undefined;
  public readonly occurredAt: Date = new Date();

  public constructor(init: APIErrorInit, options?: ErrorOptions) {
    super(init.detail, options);

    this.method = init.method;
    this.url = init.url;
    this.status = init.status;
    this.code = init.code;
    this.title = init.title;
    this.detail = init.detail;
    this.fieldErrors = init.fieldErrors;
    this.traceId = init.traceId;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  // A 4xx describes the request, so sending it again gets the same answer.
  public get isClientError(): boolean {
    return this.status >= CLIENT_ERROR_MIN_STATUS && this.status < SERVER_ERROR_MIN_STATUS;
  }

  public toReport(): ErrorReport {
    return {
      method: this.method,
      url: this.url,
      status: this.status,
      code: this.code,
      title: this.title,
      detail: this.detail,
      errors: this.fieldErrors,
      traceId: this.traceId,
      timestamp: this.occurredAt.toISOString(),
    };
  }
}
