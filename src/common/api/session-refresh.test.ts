import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { APIError, NETWORK_ERROR_CODE } from "@/common/api/api-error";
import { apiClient } from "@/common/api/client";
import { unwrap } from "@/common/api/envelope";
import type { AuthTokensDTO, UserDTO } from "@/common/api/schema.gen";
import { subscribeToSessionEvents } from "@/common/api/session-events";
import type { SessionEvent } from "@/common/api/session-events";
import { LAST_REFRESH_STORAGE_KEY, REFRESH_LOCK_NAME } from "@/common/api/session-refresh";

import { buildAuthTokensDTO } from "@test/builders/auth-tokens.builder";
import { buildUserDTO } from "@test/builders/user.builder";
import type { MockedResponse } from "@test/msw/api";
import { server } from "@test/msw/server";
import { LOGIN_URL, REFRESH_URL, unauthenticated } from "@test/msw/session";
import { USER_URL, USERS_URL } from "@test/msw/users";

const USER = buildUserDTO();

// Lands after the request that hit the expired token left, as another tab's refresh would.
const OTHER_TAB_REFRESH_DELAY_MS = 1000;

function refreshed(): HttpResponse<{ data: AuthTokensDTO }> {
  return HttpResponse.json({ data: buildAuthTokensDTO() });
}

function userFound(): HttpResponse<{ data: UserDTO }> {
  return HttpResponse.json({ data: USER });
}

// The access token is accepted only after a refresh has happened, as the backend would.
function serveExpiringAccessToken(): { refreshes: () => number } {
  let refreshCount = 0;

  server.use(
    http.post(REFRESH_URL, (): HttpResponse<{ data: AuthTokensDTO }> => {
      refreshCount += 1;

      return refreshed();
    }),
    http.get(USER_URL, (): MockedResponse => (refreshCount === 0 ? unauthenticated() : userFound())),
  );

  return { refreshes: (): number => refreshCount };
}

async function getUser(): Promise<unknown> {
  return unwrap(await apiClient.GET("/api/v1/users/{id}", { params: { path: { id: USER.id } } }));
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
    const backend = serveExpiringAccessToken();
    const events = recordSessionEvents();

    await expect(getUser()).resolves.toEqual(USER);
    expect(backend.refreshes()).toBe(1);
    expect(events).toEqual([{ type: "refreshed" }]);
  });

  it("sends the body of a write again, not an empty one", async () => {
    let hasRefreshed = false;
    const received: unknown[] = [];

    server.use(
      http.post(REFRESH_URL, (): HttpResponse<{ data: AuthTokensDTO }> => {
        hasRefreshed = true;

        return refreshed();
      }),
      http.post(USERS_URL, async ({ request }: { request: Request }): Promise<MockedResponse> => {
        received.push(await request.json());

        return hasRefreshed ? HttpResponse.json({ data: { id: USER.id } }, { status: 201 }) : unauthenticated();
      }),
    );

    const body = { name: "Jane Doe", email: "jane@example.com", password: "Change-me-1!" };

    await apiClient.POST("/api/v1/users", { body });

    expect(received).toEqual([body, body]);
  });

  it("refreshes once for every request that hit the expired token together", async () => {
    const backend = serveExpiringAccessToken();

    await Promise.all([getUser(), getUser(), getUser()]);

    expect(backend.refreshes()).toBe(1);
  });

  it("only sends the request again when another tab refreshed after it left", async () => {
    const backend = serveExpiringAccessToken();
    let userRequests = 0;

    server.use(http.get(USER_URL, (): MockedResponse => {
      userRequests += 1;

      return userRequests === 1 ? unauthenticated() : userFound();
    }));

    // The other tab's refresh lands while this request is on its way.
    localStorage.setItem(LAST_REFRESH_STORAGE_KEY, String(Date.now() + OTHER_TAB_REFRESH_DELAY_MS));

    await expect(getUser()).resolves.toEqual(USER);
    expect(backend.refreshes()).toBe(0);
  });

  it("takes the cross-tab lock when the browser has one", async () => {
    serveExpiringAccessToken();

    const request = vi.fn((_name: string, task: () => Promise<unknown>): Promise<unknown> => task());

    vi.stubGlobal("navigator", { ...navigator, languages: navigator.languages, locks: { request } });

    await getUser();

    expect(request).toHaveBeenCalledWith(REFRESH_LOCK_NAME, expect.any(Function));
  });

  it("lets the 401 stand and signs out when the refresh token is refused", async () => {
    const events = recordSessionEvents();

    server.use(
      http.post(REFRESH_URL, unauthenticated),
      http.get(USER_URL, unauthenticated),
    );

    await expect(getUser()).rejects.toMatchObject({ status: 401, code: "common.unauthenticated" });
    expect(events).toEqual([{ type: "signed-out", reason: "expired" }]);
  });

  it("reports a refresh that got no answer as that, without signing out", async () => {
    const events = recordSessionEvents();

    server.use(
      http.post(REFRESH_URL, (): Response => HttpResponse.error()),
      http.get(USER_URL, unauthenticated),
    );

    const error: unknown = await getUser().catch((caught: unknown): unknown => caught);

    expect(error).toBeInstanceOf(APIError);
    expect(error).toMatchObject({ code: NETWORK_ERROR_CODE });
    expect(events).toEqual([]);
  });

  it("treats a second 401 after the refresh as final", async () => {
    let refreshCount = 0;

    server.use(
      http.post(REFRESH_URL, (): HttpResponse<{ data: AuthTokensDTO }> => {
        refreshCount += 1;

        return refreshed();
      }),
      http.get(USER_URL, unauthenticated),
    );

    await expect(getUser()).rejects.toMatchObject({ status: 401 });
    expect(refreshCount).toBe(1);
  });

  it("never refreshes for a 401 that is the answer itself, like wrong credentials", async () => {
    let refreshCount = 0;

    server.use(
      http.post(REFRESH_URL, (): HttpResponse<{ data: AuthTokensDTO }> => {
        refreshCount += 1;

        return refreshed();
      }),
      http.post(LOGIN_URL, unauthenticated),
    );

    await expect(apiClient.POST("/api/v1/auth/login", { body: { email: "jane@example.com", password: "wrong" } }))
      .rejects.toMatchObject({ status: 401 });

    expect(refreshCount).toBe(0);
  });
});
