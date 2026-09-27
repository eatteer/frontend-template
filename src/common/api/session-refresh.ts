import { APIError, UNAUTHORIZED_STATUS } from "@/common/api/api-error";
import type { paths } from "@/common/api/schema.gen";
import { publishSessionEvent } from "@/common/api/session-events";

import type { Middleware } from "openapi-fetch";

export const REFRESH_LOCK_NAME = "session-refresh";
export const LAST_REFRESH_STORAGE_KEY = "session.lastRefreshAt";

// A 401 from these is the answer itself — wrong credentials, a refresh token refused, a sign-out —
// and refreshing to repeat them would loop or undo the very thing they did.
const NON_REFRESHING_PATHS: ReadonlySet<string> = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
] satisfies (keyof paths)[]);

export type RefreshOutcome = "refreshed" | "ended";

// A request as it left, kept to send again: `fetch` consumes the body of the one that went out.
type SentRequest = {
  replay: Request;
  sentAt: number;
};

function readLastRefreshAt(): number {
  return Number(localStorage.getItem(LAST_REFRESH_STORAGE_KEY) ?? 0);
}

// Web Locks makes the refresh exclusive across every tab of this origin. Without it — an old browser,
// the test environment — it is exclusive within this tab only.
async function runExclusively<T>(task: () => Promise<T>): Promise<T> {
  if (!("locks" in navigator)) {
    return task();
  }

  return navigator.locks.request(REFRESH_LOCK_NAME, task);
}

// Each refresh token is good for exactly one use: the backend treats a second presentation as theft
// and revokes the whole sign-in. So a refresh runs once however many requests — in however many
// tabs — hit the expired access token together.
//
// - Within a tab, callers share the refresh already in flight.
// - Across tabs, the lock queues them, and whoever gets it after another tab refreshed finds a
//   refresh newer than its own request and only has to send the request again.
//
// The second check also covers a 401 that arrives after a refresh this tab already finished: the
// request left with the old cookie, and a new refresh would present a token that is already spent.
export function createRefreshCoordinator(refresh: () => Promise<unknown>): (sentAt: number) => Promise<RefreshOutcome> {
  let inFlight: Promise<RefreshOutcome> | undefined;

  async function refreshUnlessDone(sentAt: number): Promise<RefreshOutcome> {
    if (readLastRefreshAt() > sentAt) {
      return "refreshed";
    }

    try {
      await refresh();
    } catch (error: unknown) {
      if (error instanceof APIError && error.status === UNAUTHORIZED_STATUS) {
        publishSessionEvent({ type: "signed-out", reason: "expired" });

        return "ended";
      }

      // No answer, or one that says nothing about the session: the caller sees that failure instead
      // of a 401 that would sign the reader out for a dropped connection.
      throw error;
    }

    localStorage.setItem(LAST_REFRESH_STORAGE_KEY, String(Date.now()));
    publishSessionEvent({ type: "refreshed" });

    return "refreshed";
  }

  return (sentAt: number): Promise<RefreshOutcome> => {
    inFlight ??= runExclusively((): Promise<RefreshOutcome> => refreshUnlessDone(sentAt)).finally((): void => {
      inFlight = undefined;
    });

    return inFlight;
  };
}

// Registered after the middleware that turns failures into APIError: response middlewares run in
// reverse, so this one sees the raw 401 first, and whatever it answers with — the request sent again,
// or the 401 itself — goes on to be turned into data or an error as usual.
export function createSessionRefreshMiddleware(refresh: () => Promise<unknown>): Middleware {
  const refreshOnce = createRefreshCoordinator(refresh);
  const sentRequests = new WeakMap<Request, SentRequest>();

  return {
    onRequest: ({ request, schemaPath }: { request: Request; schemaPath: string }): undefined => {
      if (!NON_REFRESHING_PATHS.has(schemaPath)) {
        sentRequests.set(request, { replay: request.clone(), sentAt: Date.now() });
      }

      return undefined;
    },
    onResponse: async ({ request, response, options }: {
      request: Request;
      response: Response;
      options: { fetch: (request: Request) => Promise<Response> };
    }): Promise<Response | undefined> => {
      const sent = sentRequests.get(request);

      sentRequests.delete(request);

      if (response.status !== UNAUTHORIZED_STATUS || sent === undefined) {
        return undefined;
      }

      if (await refreshOnce(sent.sentAt) === "ended") {
        return undefined;
      }

      // Straight to the network, past every middleware: a second 401 is final, not another refresh.
      return options.fetch(sent.replay);
    },
  };
}
