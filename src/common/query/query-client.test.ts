import { beforeEach, describe, expect, it, vi } from "vitest";

import { showErrorToast } from "@/common/components/error-toast";
import { setErrorReporter } from "@/common/lib/error-reporter";
import { createQueryClient, MAX_QUERY_RETRIES, shouldRetryQuery } from "@/common/query/query-client";

import { buildApiError } from "@test/builders/api-error.builder";

vi.mock("@/common/components/error-toast", () => ({ showErrorToast: vi.fn() }));

const USERS_KEY = ["users"];

describe("shouldRetryQuery", () => {
  it("never repeats a request the server rejected", () => {
    expect(shouldRetryQuery(0, buildApiError({ status: 404 }))).toBe(false);
  });

  it("retries a server failure or a lost connection a bounded number of times", () => {
    const serverError = buildApiError({ status: 503 });

    expect(shouldRetryQuery(0, serverError)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, serverError)).toBe(false);
    expect(shouldRetryQuery(0, new TypeError("boom"))).toBe(true);
  });
});

describe("createQueryClient", () => {
  beforeEach(() => {
    vi.mocked(showErrorToast).mockClear();
  });

  it("leaves a query that never loaded to its own error state", async () => {
    const queryClient = createQueryClient();

    await queryClient.prefetchQuery({
      queryKey: USERS_KEY,
      queryFn: () => Promise.reject(buildApiError({ status: 404 })),
    });

    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("toasts a refetch that fails behind data already on screen", async () => {
    const queryClient = createQueryClient();
    const error = buildApiError({ status: 404 });

    queryClient.setQueryData(USERS_KEY, []);

    await queryClient.prefetchQuery({ queryKey: USERS_KEY, queryFn: () => Promise.reject(error) });

    expect(showErrorToast).toHaveBeenCalledWith(error);
  });

  it("stays quiet for a query that asked to", async () => {
    const queryClient = createQueryClient();

    queryClient.setQueryData(USERS_KEY, []);

    await queryClient.prefetchQuery({
      queryKey: USERS_KEY,
      queryFn: () => Promise.reject(buildApiError({ status: 404 })),
      meta: { errorToast: false },
    });

    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("toasts a failed mutation unless its caller shows the failure itself", async () => {
    const queryClient = createQueryClient();
    const error = buildApiError();
    const mutationFn = (): Promise<never> => Promise.reject(error);
    const mutationCache = queryClient.getMutationCache();

    await expect(mutationCache.build(queryClient, { mutationFn }).execute(undefined)).rejects.toBe(error);

    await expect(
      mutationCache.build(queryClient, { mutationFn, meta: { errorToast: false } }).execute(undefined),
    ).rejects.toBe(error);

    expect(showErrorToast).toHaveBeenCalledTimes(1);
  });

  it("never toasts a 401, which is on its way to the sign-in page", async () => {
    const queryClient = createQueryClient();
    const error = buildApiError({ status: 401, code: "common.unauthenticated" });
    const mutationCache = queryClient.getMutationCache();

    queryClient.setQueryData(USERS_KEY, []);

    await queryClient.prefetchQuery({ queryKey: USERS_KEY, queryFn: () => Promise.reject(error) });

    await expect(mutationCache.build(queryClient, { mutationFn: () => Promise.reject(error) }).execute(undefined))
      .rejects.toBe(error);

    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("reports a query or mutation that threw a bug rather than the server's answer", async () => {
    const report = vi.fn();
    const queryClient = createQueryClient();
    const bug = new TypeError("Cannot read properties of undefined (reading 'items')");
    const mutationCache = queryClient.getMutationCache();

    setErrorReporter(report);

    await queryClient.prefetchQuery({ queryKey: USERS_KEY, queryFn: () => Promise.reject(bug), retry: false });
    await queryClient.prefetchQuery({ queryKey: ["user"], queryFn: () => Promise.reject(buildApiError()) });

    await expect(mutationCache.build(queryClient, { mutationFn: () => Promise.reject(bug) }).execute(undefined))
      .rejects.toBe(bug);

    expect(report.mock.calls).toEqual([[bug, "query"], [bug, "query"]]);
  });
});
