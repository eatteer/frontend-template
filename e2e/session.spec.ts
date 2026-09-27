import { ACCESS_TOKEN_COOKIE, apiUrl, setAccountLanguage, signIn } from "./support/api";
import { expect, test as base } from "./support/fixtures";

import type { BrowserContext, Cookie, Page, Request } from "@playwright/test";

type SessionFixtures = {
  // Signs in for this test alone instead of reusing the administrator's shared cookies.
  ownSession: boolean;
  twoTabs: [Page, Page];
};

// Two tabs of one browser, on the users page.
const test = base.extend<SessionFixtures>({
  ownSession: [false, { option: true }],
  twoTabs: async (
    { context, ownSession }: { context: BrowserContext; ownSession: boolean },
    use: (twoTabs: [Page, Page]) => Promise<void>,
  ): Promise<void> => {
    if (ownSession) {
      await signIn(context.request);
    }

    const first = await context.newPage();
    const second = await context.newPage();

    await Promise.all([first.goto("/users"), second.goto("/users")]);

    for (const tab of [first, second]) {
      await expect(tab.getByRole("heading", { name: "Users" })).toBeVisible();
    }

    await use([first, second]);
  },
});

test.describe("with a session of its own", () => {
  // Refreshing rotates the refresh token, and the one the other specs share would not survive it.
  test.use({ storageState: { cookies: [], origins: [] }, ownSession: true });

  test("an expired access token is refreshed once, however many tabs ask at the same time", async ({ context, twoTabs }) => {
    const [first, second] = twoTabs;
    const refreshes: Request[] = [];

    context.on("request", (request: Request): void => {
      if (request.url() === apiUrl("/auth/refresh")) {
        refreshes.push(request);
      }
    });

    // Without the access cookie the backend answers exactly as it does to an expired one: 401
    // `common.unauthenticated`.
    await context.clearCookies({ name: ACCESS_TOKEN_COOKIE });
    await Promise.all([first.reload(), second.reload()]);

    for (const tab of [first, second]) {
      await expect(tab.getByRole("table", { name: "Users" }).getByRole("link").first()).toBeVisible();
    }

    expect(refreshes).toHaveLength(1);
    expect((await context.cookies()).some((cookie: Cookie): boolean => cookie.name === ACCESS_TOKEN_COOKIE)).toBe(true);
  });
});

test("a language chosen in one tab is the account's, and the other tab follows it", async ({ context, twoTabs }) => {
  const [first, second] = twoTabs;

  try {
    await first.getByRole("button", { name: "Language" }).click();
    await first.getByRole("menuitemradio", { name: "Español" }).click();

    await expect(first.getByRole("heading", { name: "Usuarios" })).toBeVisible();
    await expect(second.getByRole("heading", { name: "Usuarios" })).toBeVisible();

    // A reload reads it back from the account, not from this browser.
    await second.evaluate((): void => {
      localStorage.clear();
    });

    await second.reload();

    await expect(second.getByRole("heading", { name: "Usuarios" })).toBeVisible();
  } finally {
    await setAccountLanguage(context.request, "en");
  }
});
