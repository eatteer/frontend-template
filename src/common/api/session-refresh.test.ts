import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, NETWORK_ERROR_CODE } from "@/common/api/api-error";
import { apiClient } from "@/common/api/client";
import { unwrap } from "@/common/api/envelope";
import { subscribeToSessionEvents } from "@/common/api/session-events";
import type { SessionEvent } from "@/common/api/session-events";

import { buildProblemDetails } from "@test/builders/problem-details.builder";
import { server } from "@test/msw/server";

const API_URL = "http://api.test/api/v1";
const REFRESH_URL = `${API_URL}/auth/refresh`;
const USER_ID = "01890a5d-ac96-774b-bcce-b302099a8057";

const UNAUTHENTICATED = HttpResponse.json(
  buildProblemDetails({ status: 401, title: "Unauthorized", code: "common.unauthenticated" }),
  { status: 401, headers: { "Content-Type": "application/problem+json" } },
);

const REFRESHED = { data: { accessToken: null, refreshToken: null, expiresAt: "2026-10-26T00:00:00.000Z" } };

// The access token is accepted only after a refresh has happened, as the backend would.
function useExpiringAccessToken(): { refreshes: () => number } {
  let refreshCount = 0;

  server.use(
    http.post(REFRESH_URL, () => {
      refreshCount += 1;

      return HttpResponse.json(REFRESHED);
    }),
    http.get(`${API_URL}/users/:id`, () => (refreshCount === 0 ? UNAUTHENTICATED.clone() : HttpResponse.json({ data: { id: USER_ID } }))),
  );

  return { refreshes: () => refreshCount };
}

async function getUser(): Promise<unknown> {
  return unwrap(await apiClient.GET("/api/v1/users/{id}", { params: { path: { id: USER_ID } } }));
}

function recordSessionEvents(): SessionEvent[] {
  const events: SessionEvent[] = [];

  unsubscribe = subscribeToSessionEvents((event: SessionEvent): void => {
    events.push(event);
  });

  return events;
}

let unsubscribe: (() => void) | undefined;

describe("the session refresh", () => {
  afterEach(() => {
    unsubscribe?.();
    vi.unstubAllGlobals();
  });

  it("refreshes on a 401 and sends the request again", async () => {
    const backend = useExpiringAccessToken();
    const events = recordSessionEvents();

    await expect(getUser()).resolves.toEqual({ id: USER_ID });
    expect(backend.refreshes()).toBe(1);
    expect(events).toEqual([{ type: "refreshed" }]);
  });

  it("sends the body of a write again, not an empty one", async () => {
    let refreshed = false;
    const received: unknown[] = [];

    server.use(
      http.post(REFRESH_URL, () => {
        refreshed = true;

        return HttpResponse.json(REFRESHED);
      }),
      http.post(`${API_URL}/users`, async ({ request }: { request: Request }) => {
        received.push(await request.json());

        return refreshed ? HttpResponse.json({ data: { id: USER_ID } }, { status: 201 }) : UNAUTHENTICATED.clone();
      }),
    );

    const body = { name: "Jane Doe", email: "jane@example.com", password: "Change-me-1!" };

    await apiClient.POST("/api/v1/users", { body });

    expect(received).toEqual([body, body]);
  });

  it("refreshes once for every request that hit the expired token together", async () => {
    const backend = useExpiringAccessToken();

    await Promise.all([getUser(), getUser(), getUser()]);

    expect(backend.refreshes()).toBe(1);
  });

  it("only sends the request again when another tab refreshed after it left", async () => {
    const backend = useExpiringAccessToken();
    let userRequests = 0;

    server.use(http.get(`${API_URL}/users/:id`, () => {
      userRequests += 1;

      return userRequests === 1 ? UNAUTHENTICATED.clone() : HttpResponse.json({ data: { id: USER_ID } });
    }));

    // The other tab's refresh lands while this request is on its way.
    localStorage.setItem("session.lastRefreshAt", String(Date.now() + 1000));

    await expect(getUser()).resolves.toEqual({ id: USER_ID });
    expect(backend.refreshes()).toBe(0);
  });

  it("takes the cross-tab lock when the browser has one", async () => {
    useExpiringAccessToken();

    const request = vi.fn((_name: string, task: () => Promise<unknown>): Promise<unknown> => task());

    vi.stubGlobal("navigator", { ...navigator, languages: navigator.languages, locks: { request } });

    await getUser();

    expect(request).toHaveBeenCalledWith("session-refresh", expect.any(Function));
  });

  it("lets the 401 stand and signs out when the refresh token is refused", async () => {
    const events = recordSessionEvents();

    server.use(
      http.post(REFRESH_URL, () => UNAUTHENTICATED.clone()),
      http.get(`${API_URL}/users/:id`, () => UNAUTHENTICATED.clone()),
    );

    await expect(getUser()).rejects.toMatchObject({ status: 401, code: "common.unauthenticated" });
    expect(events).toEqual([{ type: "signed-out", reason: "expired" }]);
  });

  it("reports a refresh that got no answer as that, without signing out", async () => {
    const events = recordSessionEvents();

    server.use(
      http.post(REFRESH_URL, () => HttpResponse.error()),
      http.get(`${API_URL}/users/:id`, () => UNAUTHENTICATED.clone()),
    );

    const error: unknown = await getUser().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: NETWORK_ERROR_CODE });
    expect(events).toEqual([]);
  });

  it("treats a second 401 after the refresh as final", async () => {
    let refreshCount = 0;

    server.use(
      http.post(REFRESH_URL, () => {
        refreshCount += 1;

        return HttpResponse.json(REFRESHED);
      }),
      http.get(`${API_URL}/users/:id`, () => UNAUTHENTICATED.clone()),
    );

    await expect(getUser()).rejects.toMatchObject({ status: 401 });
    expect(refreshCount).toBe(1);
  });

  it("never refreshes for a 401 that is the answer itself, like wrong credentials", async () => {
    let refreshCount = 0;

    server.use(
      http.post(REFRESH_URL, () => {
        refreshCount += 1;

        return HttpResponse.json(REFRESHED);
      }),
      http.post(`${API_URL}/auth/login`, () => UNAUTHENTICATED.clone()),
    );

    await expect(apiClient.POST("/api/v1/auth/login", { body: { email: "jane@example.com", password: "wrong" } }))
      .rejects.toMatchObject({ status: 401 });

    expect(refreshCount).toBe(0);
  });
});
