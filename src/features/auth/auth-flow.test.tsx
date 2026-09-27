import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import type { AuthTokensDTO, ProblemDetailsDTO } from "@/common/api/schema.gen";
import { publishSessionEvent, SESSION_CHANNEL_NAME } from "@/common/api/session-events";
import { sessionQuery } from "@/features/auth/api/session-queries";

import { buildAuthTokensDTO } from "@test/builders/auth-tokens.builder";
import { buildSessionDTO } from "@test/builders/session.builder";
import { problem } from "@test/msw/api";
import type { MockedResponse } from "@test/msw/api";
import { server } from "@test/msw/server";
import { LOGIN_URL, LOGOUT_URL, REFRESH_URL, SESSION_URL, signedIn, signedOut, unauthenticated } from "@test/msw/session";
import { renderRoute } from "@test/render";

// Another tab, as far as this one can tell: a second channel on the same name.
const otherTab = new BroadcastChannel(SESSION_CHANNEL_NAME);

// `server.use` gives precedence to the first handler for a route, so a test's own session handler
// goes before anything else answering the session.

// The backend after a successful sign-in: the session answers once the login has set the cookies.
function serveBackendThatSignsIn(): { loginBodies: unknown[] } {
  const loginBodies: unknown[] = [];
  let isSignedIn = false;

  server.use(
    http.post(REFRESH_URL, unauthenticated),
    http.post(LOGIN_URL, async ({ request }: { request: Request }): Promise<HttpResponse<{ data: AuthTokensDTO }>> => {
      loginBodies.push(await request.json());

      isSignedIn = true;

      return HttpResponse.json({ data: buildAuthTokensDTO() });
    }),
    http.get(SESSION_URL, (): MockedResponse => (isSignedIn ? HttpResponse.json({ data: buildSessionDTO() }) : unauthenticated())),
  );

  return { loginBodies };
}

async function fillAndSubmit(email: string, password: string): Promise<void> {
  const user = userEvent.setup();

  await user.type(await screen.findByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);

  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("signing in", () => {
  it("sends a visitor without a session to sign in, remembering where they were going", async () => {
    server.use(...signedOut());

    const { router } = renderRoute("/?tab=recent");

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();

    expect(router.state.location.pathname).toBe("/sign-in");
    expect(router.state.location.search).toEqual({ redirect: "/?tab=recent" });
  });

  it("signs in and goes on to the page that was asked for", async () => {
    const backend = serveBackendThatSignsIn();

    const { router } = renderRoute("/sign-in?redirect=%2F%3Ftab%3Drecent");

    await fillAndSubmit("admin@example.com", "Change-me-1!");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    expect(router.state.location.href).toBe("/?tab=recent");

    expect(backend.loginBodies).toEqual([{ email: "admin@example.com", password: "Change-me-1!" }]);

    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
  });

  it("goes home instead of following a redirect to another site", async () => {
    serveBackendThatSignsIn();

    const { router } = renderRoute("/sign-in?redirect=%2F%2Fevil.example");

    await fillAndSubmit("admin@example.com", "Change-me-1!");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    expect(router.state.location.href).toBe("/");
  });

  it("checks the fields before sending anything", async () => {
    const backend = serveBackendThatSignsIn();

    const user = userEvent.setup();

    renderRoute("/sign-in");

    await user.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter a valid email address");
    expect(screen.getByLabelText("Email")).toHaveFocus();

    expect(backend.loginBodies).toEqual([]);
  });

  it("explains wrong credentials in the form, not in a toast", async () => {
    server.use(
      ...signedOut(),
      http.post(LOGIN_URL, (): HttpResponse<ProblemDetailsDTO> => problem({
        status: 401,
        title: "Unauthorized",
        detail: "Invalid credentials",
        code: "auth.invalid_credentials",
      })),
    );

    renderRoute("/sign-in");

    await fillAndSubmit("admin@example.com", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
    expect(screen.queryByRole("region", { name: "Notifications" })).toBeEmptyDOMElement();
  });

  it("puts the backend's field errors on their fields and focuses the first", async () => {
    server.use(
      ...signedOut(),
      http.post(LOGIN_URL, (): HttpResponse<ProblemDetailsDTO> => problem({
        status: 400,
        code: "common.validation_error",
        errors: [{ field: "email", message: "The email is not valid" }],
      })),
    );

    renderRoute("/sign-in");

    await fillAndSubmit("admin@example.com", "Change-me-1!");

    expect(await screen.findByText("The email is not valid")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(screen.queryByText("Validation failed")).not.toBeInTheDocument();
  });

  it("sends someone already signed in on to where they were headed", async () => {
    const { router } = renderRoute("/sign-in");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    expect(router.state.location.pathname).toBe("/");
  });

  it("follows another tab's sign-in from the sign-in page", async () => {
    let isSignedIn = false;

    server.use(
      http.post(REFRESH_URL, unauthenticated),
      http.get(SESSION_URL, (): MockedResponse => (isSignedIn ? HttpResponse.json({ data: buildSessionDTO() }) : unauthenticated())),
    );

    const { router } = renderRoute("/sign-in?redirect=%2F");

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();

    isSignedIn = true;

    otherTab.postMessage({ type: "signed-in" });

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    expect(router.state.location.pathname).toBe("/");
  });

  // The failure is the query cache's to show; the tab stays where it is and follows the next event.
  it("stays on the sign-in page, and says why, when another tab's session cannot be read", async () => {
    let isSignedIn = false;

    server.use(
      http.post(REFRESH_URL, unauthenticated),
      http.get(SESSION_URL, (): MockedResponse => (isSignedIn ? problem({ status: 429, code: "common.too_many_requests", title: "Too Many Requests", detail: "Try again in a minute" }) : unauthenticated())),
    );

    const { router } = renderRoute("/sign-in?redirect=%2F");

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();

    isSignedIn = true;

    otherTab.postMessage({ type: "signed-in" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Try again in a minute");

    expect(router.state.location.pathname).toBe("/sign-in");
  });
});

describe("signing out", () => {
  it("signs out from the account menu, forgets the session and stays on the sign-in page", async () => {
    const user = userEvent.setup();

    let signedOutCalls = 0;

    server.use(http.post(LOGOUT_URL, (): HttpResponse<undefined> => {
      signedOutCalls += 1;

      server.use(...signedOut());

      return new HttpResponse(undefined, { status: 204 });
    }));

    const { router, queryClient } = renderRoute("/");

    await user.click(await screen.findByRole("button", { name: "Account" }));

    expect(await screen.findByText("admin@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();

    expect(router.state.location.search).toEqual({});

    expect(signedOutCalls).toBe(1);

    expect(queryClient.getQueryData(sessionQuery.queryKey)).toBeNull();
  });

  it("leaves when another tab signs out, and will come back after signing in", async () => {
    const { router } = renderRoute("/?tab=recent");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    server.use(...signedOut());

    otherTab.postMessage({ type: "signed-out", reason: "sign-out" });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();

    expect(router.state.location.search).toEqual({ redirect: "/?tab=recent" });
  });

  it("leaves when the refresh token is refused, and will come back after signing in", async () => {
    const { router, queryClient } = renderRoute("/");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    queryClient.setQueryData(["unrelated"], "cached for the previous account");

    server.use(...signedOut());

    publishSessionEvent({ type: "signed-out", reason: "expired" });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();

    expect(router.state.location.search).toEqual({ redirect: "/" });

    expect(queryClient.getQueryData(["unrelated"])).toBeUndefined();
  });
});

describe("refreshing", () => {
  it("reads the session again after a refresh, which may carry new permissions", async () => {
    const { queryClient } = renderRoute("/");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    server.use(signedIn(buildSessionDTO({ permissions: ["users:read"] })));

    otherTab.postMessage({ type: "refreshed" });

    await waitFor(() => {
      expect(queryClient.getQueryData(sessionQuery.queryKey)?.permissions).toEqual(["users:read"]);
    });
  });
});
