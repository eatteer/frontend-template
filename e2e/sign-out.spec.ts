import { createUser, deleteUser, E2E_USER_PASSWORD, makeAdministrator, signIn } from "./support/api";
import { ADMIN_STORAGE_STATE } from "./support/env";
import { expect, test } from "./support/fixtures";

import type { APIRequestContext, Cookie, Route } from "@playwright/test";

// Signing out revokes the session it ends, so this spec ends one of its own: an account made for the
// run, with every permission, whose sign-ins do not count against the administrator's.
const RUN = `e2e${Date.now().toString(36)}`;

const USERS_COLLECTION_PATH = "/api/v1/users";

let api: APIRequestContext;
let account: { id: string; email: string };

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeAll(async ({ playwright }) => {
  api = await playwright.request.newContext({ storageState: ADMIN_STORAGE_STATE });

  const user = await createUser(api, `${RUN} signs out`, `${RUN}-signs-out@example.com`);

  await makeAdministrator(api, user.id);

  account = { id: user.id, email: user.email };
});

test.afterAll(async () => {
  await deleteUser(api, account.id);

  await api.dispose();
});

test("signing out leaves every tab on sign-in, and nothing the account saw survives for the next sign-in", async ({ context }) => {
  await signIn(context.request, { email: account.email, password: E2E_USER_PASSWORD });

  const first = await context.newPage();
  const second = await context.newPage();

  await Promise.all([first.goto("/users"), second.goto("/users")]);

  for (const tab of [first, second]) {
    await expect(tab.getByRole("table", { name: "Users" }).getByRole("link").first()).toBeVisible();
  }

  await first.getByRole("button", { name: "Account" }).click();
  await first.getByRole("menuitem", { name: "Sign out" }).click();

  // The reader chose to leave this page, so it is not where the next sign-in returns; the other tab
  // lost its session without choosing, so it keeps where it was.
  await expect(first).toHaveURL("/sign-in");
  await expect(second).toHaveURL("/sign-in?redirect=%2Fusers");

  expect((await context.cookies()).map((cookie: Cookie): string => cookie.name)).toEqual([]);

  await first.getByLabel("Email").fill(account.email);
  await first.getByLabel("Password").fill(E2E_USER_PASSWORD);

  await first.getByRole("button", { name: "Sign in" }).click();

  await expect(first).toHaveURL("/");
  // The other tab follows the sign-in to where it was going.
  await expect(second).toHaveURL("/users");

  // Held, so what the list shows before the backend answers is what the cache still had: a cleared
  // cache has no rows to show, only the skeleton.
  let release: () => void = (): void => undefined;

  const released = new Promise<void>((resolve: () => void): void => {
    release = resolve;
  });

  await first.route((url: URL): boolean => url.pathname === USERS_COLLECTION_PATH, async (route: Route): Promise<void> => {
    await released;

    await route.fallback();
  });

  // Through the navigation, not a reload: a reload would start a new cache whatever sign-out did.
  await first.getByRole("link", { name: "Users", exact: true }).click();

  const table = first.getByRole("table", { name: "Users" });

  await expect(table).toHaveAttribute("aria-busy", "true");
  await expect(table.getByRole("link")).toHaveCount(0);

  release();

  await expect(table.getByRole("link").first()).toBeVisible();
});
