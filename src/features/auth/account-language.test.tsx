import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";

import type { ProblemDetailsDto } from "@/common/api/schema.gen";
import { SESSION_CHANNEL_NAME } from "@/common/api/session-events";
import { LANGUAGE_STORAGE_KEY } from "@/common/i18n/i18n";
import { sessionQuery } from "@/features/auth/api/session-queries";

import { buildSessionDto } from "@test/builders/session.builder";
import { problem } from "@test/msw/api";
import { server } from "@test/msw/server";
import { PREFERENCES_URL, signedIn } from "@test/msw/session";
import { renderRoute, warmUpRoutes } from "@test/render";

// Another tab, as far as this one can tell: a second channel on the same name.
const otherTab = new BroadcastChannel(SESSION_CHANNEL_NAME);

const SPANISH_SESSION = buildSessionDto({
  user: { ...buildSessionDto().user, preferredLanguage: "es" },
});

async function pickSpanish(): Promise<void> {
  const user = userEvent.setup();

  await user.click(await screen.findByRole("button", { name: "Language" }));
  await user.click(await screen.findByRole("menuitemradio", { name: "Español" }));
}

beforeAll(warmUpRoutes);

describe("the account's language", () => {
  it("applies once the session is read, and is where the next visit starts", async () => {
    server.use(signedIn(SPANISH_SESSION));

    renderRoute("/");

    expect(await screen.findByRole("heading", { name: "Bienvenido" })).toBeInTheDocument();

    expect(document.documentElement.lang).toBe("es");

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
  });

  it("switches at once, stores the choice on the account and tells the other tabs", async () => {
    const bodies: unknown[] = [];
    const messages: unknown[] = [];
    let store: (() => void) | undefined;

    const stored = new Promise<void>((resolve: () => void): void => {
      store = resolve;
    });

    otherTab.onmessage = (message: MessageEvent<unknown>): void => {
      messages.push(message.data);
    };

    server.use(http.patch(PREFERENCES_URL, async ({ request }: { request: Request }): Promise<HttpResponse<null>> => {
      bodies.push(await request.json());

      await stored;

      return new HttpResponse(null, { status: 204 });
    }));

    const { queryClient } = renderRoute("/");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    await pickSpanish();

    // Before the backend has answered: the screen switches without waiting, and nothing covers it.
    expect(await screen.findByRole("heading", { name: "Bienvenido" })).toBeInTheDocument();

    await waitFor(() => {
      expect(bodies).toEqual([{ preferredLanguage: "es" }]);
    });

    expect(screen.queryByLabelText("Guardando…")).not.toBeInTheDocument();

    if (store) {
      store();
    }

    await waitFor(() => {
      expect(messages).toEqual([{ type: "updated" }]);
    });

    expect(queryClient.getQueryData(sessionQuery.queryKey)?.user.preferredLanguage).toBe("es");

    otherTab.onmessage = null;
  });

  it("switches back and says why when the account refuses the change", async () => {
    server.use(http.patch(PREFERENCES_URL, (): HttpResponse<ProblemDetailsDto> => problem({
      status: 500,
      title: "Internal Server Error",
      detail: "Something failed",
      code: "common.internal_error",
    })));

    const { queryClient } = renderRoute("/");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    await pickSpanish();

    expect(within(await screen.findByRole("alert")).getByText("Something failed")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");

    expect(queryClient.getQueryData(sessionQuery.queryKey)?.user.preferredLanguage).toBe("en");
  });

  it("follows a change made in another tab", async () => {
    renderRoute("/");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();

    server.use(signedIn(SPANISH_SESSION));

    otherTab.postMessage({ type: "updated" });

    expect(await screen.findByRole("heading", { name: "Bienvenido" })).toBeInTheDocument();
  });
});
