import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { setErrorReporter } from "@/common/lib/error-reporter";
import { createQueryClient, MAX_QUERY_RETRIES, shouldRetryQuery } from "@/common/query/query-client";

import { buildApiError } from "@test/builders/api-error.builder";
import { renderWithProviders } from "@test/render";

import type { QueryClient } from "@tanstack/react-query";

const USERS_KEY = ["users"];

// The toaster mounted beside nothing, so a toast the cache shows is on screen to be found.
function renderToaster(): QueryClient {
  return renderWithProviders(null).queryClient;
}

// The failure the cache is expected to toast, after the ones it is expected to keep quiet: if any of
// those had toasted, it would be on screen beside this one.
async function expectOnlyToast(detail: string): Promise<void> {
  const alerts = await screen.findAllByRole("alert");

  expect(alerts.map((alert: HTMLElement): string | null => alert.textContent)).toEqual([expect.stringContaining(detail)]);
}

async function failMutation(queryClient: QueryClient, error: Error, errorToast?: boolean): Promise<void> {
  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationFn: (): Promise<never> => Promise.reject(error),
    meta: errorToast === undefined ? undefined : { errorToast },
  });

  await expect(mutation.execute(undefined)).rejects.toBe(error);
}

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
  it("leaves a query that never loaded to its own error state, and toasts a refetch that fails behind data", async () => {
    const queryClient = renderToaster();

    await queryClient.prefetchQuery({
      queryKey: ["user"],
      queryFn: (): Promise<never> => Promise.reject(buildApiError({ status: 404, detail: "The first load failed" })),
    });

    queryClient.setQueryData(USERS_KEY, []);

    await queryClient.prefetchQuery({
      queryKey: USERS_KEY,
      queryFn: (): Promise<never> => Promise.reject(buildApiError({ status: 404, detail: "The refetch failed" })),
    });

    await expectOnlyToast("The refetch failed");
  });

  it("stays quiet for a query that asked to", async () => {
    const queryClient = renderToaster();

    queryClient.setQueryData(["user"], {});

    await queryClient.prefetchQuery({
      queryKey: ["user"],
      queryFn: (): Promise<never> => Promise.reject(buildApiError({ status: 404, detail: "The quiet refetch failed" })),
      meta: { errorToast: false },
    });

    queryClient.setQueryData(USERS_KEY, []);

    await queryClient.prefetchQuery({
      queryKey: USERS_KEY,
      queryFn: (): Promise<never> => Promise.reject(buildApiError({ status: 404, detail: "The refetch failed" })),
    });

    await expectOnlyToast("The refetch failed");
  });

  it("toasts a failed mutation unless its caller shows the failure itself", async () => {
    const queryClient = renderToaster();

    await failMutation(queryClient, buildApiError({ detail: "The caller explains this one" }), false);
    await failMutation(queryClient, buildApiError({ detail: "Nobody else explains this one" }));

    await expectOnlyToast("Nobody else explains this one");
  });

  it("never toasts a 401, which is on its way to the sign-in page", async () => {
    const queryClient = renderToaster();
    const unauthenticated = buildApiError({ status: 401, code: "common.unauthenticated", detail: "Authentication is required" });

    queryClient.setQueryData(["user"], {});

    await queryClient.prefetchQuery({ queryKey: ["user"], queryFn: (): Promise<never> => Promise.reject(unauthenticated) });
    await failMutation(queryClient, unauthenticated);
    await failMutation(queryClient, buildApiError({ detail: "The save failed" }));

    await expectOnlyToast("The save failed");
  });

  it("reports a query or mutation that threw a bug rather than the server's answer", async () => {
    const report = vi.fn();
    const queryClient = createQueryClient();
    const queryBug = new TypeError("Cannot read properties of undefined (reading 'items')");
    const mutationBug = new TypeError("Cannot read properties of undefined (reading 'id')");

    setErrorReporter(report);

    await queryClient.prefetchQuery({ queryKey: USERS_KEY, queryFn: (): Promise<never> => Promise.reject(queryBug), retry: false });
    await queryClient.prefetchQuery({ queryKey: ["user"], queryFn: (): Promise<never> => Promise.reject(buildApiError()) });
    await failMutation(queryClient, mutationBug);

    expect(report.mock.calls).toEqual([[queryBug, "query"], [mutationBug, "query"]]);
  });
});
