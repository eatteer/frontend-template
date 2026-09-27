import { createUser, deleteUser, E2E_USER_PASSWORD, TRACE_ID_HEADER } from "./support/api";
import { ADMIN_STORAGE_STATE } from "./support/env";
import { expect, test } from "./support/fixtures";

import type { APIRequestContext, Page, Request, Response, Route } from "@playwright/test";

// Every user this run creates carries it in its name and email, so a search finds exactly them
// whatever else the database holds, and the clean-up knows what to delete.
const RUN = `e2e${Date.now().toString(36)}`;

// More than a page holds, so the list has a second one. The page size itself is read from the
// request the list sends, since the suite never imports the application.
const SEEDED_USERS = 11;

// The backend's own limits, which the form leaves to it (create-user.schema.ts).
const NAME_MAX_LENGTH = 120;
const PASSWORD_MAX_BYTES = 72;

// Long enough for ERROR_TOAST_TIMEOUT_MS and the toast's exit.
const TOAST_GONE_TIMEOUT_MS = 12_000;

const USERS_COLLECTION_PATH = "/api/v1/users";

// A user's page, which `/users/new` is not.
const USER_DETAIL_URL = /\/users\/(?!new$)[^/]+$/;

const createdIds: string[] = [];

function emailOf(label: string): string {
  return `${RUN}-${label}@example.com`;
}

function isUsersCollection(request: Request): boolean {
  return new URL(request.url()).pathname === USERS_COLLECTION_PATH;
}

function isUsersCreation(response: Response): boolean {
  return response.request().method() === "POST" && isUsersCollection(response.request());
}

// Holds every matching request until `release` is called, so a spec can see the screen that shows
// while the answer is on its way — the skeleton, the loader — however fast the backend is.
async function holdRequests(page: Page, matches: (request: Request) => boolean): Promise<() => void> {
  let release: () => void = (): void => undefined;

  const released = new Promise<void>((resolve: () => void): void => {
    release = resolve;
  });

  await page.route((url: URL): boolean => url.pathname.startsWith(USERS_COLLECTION_PATH), async (route: Route): Promise<void> => {
    if (matches(route.request())) {
      await released;
    }

    await route.fallback();
  });

  return release;
}

function idFromUrl(page: Page): string {
  const id = new URL(page.url()).pathname.split("/").at(-1);

  if (id === undefined) {
    throw new Error(`No user id in ${page.url()}`);
  }

  return id;
}

let api: APIRequestContext;

test.beforeAll(async ({ playwright }) => {
  api = await playwright.request.newContext({ storageState: ADMIN_STORAGE_STATE });

  for (let index = 1; index <= SEEDED_USERS; index += 1) {
    const label = String(index).padStart(2, "0");
    const user = await createUser(api, `${RUN} user ${label}`, emailOf(label));

    createdIds.push(user.id);
  }
});

test.afterAll(async () => {
  for (const id of createdIds) {
    await deleteUser(api, id);
  }

  await api.dispose();
});

test("the list shows a skeleton, then the users, and keeps its page and search in the URL", async ({ page }) => {
  const release = await holdRequests(page, (request: Request): boolean => request.method() === "GET" && isUsersCollection(request));

  const listRequest = page.waitForRequest((request: Request): boolean => request.method() === "GET" && isUsersCollection(request));

  await page.goto(`/users?search=${RUN}`);

  // The list states its page size rather than leaving it to the backend's default.
  const limit = new URL((await listRequest).url()).searchParams.get("limit");

  expect(limit).not.toBeNull();

  const pageSize = Number(limit);

  expect(pageSize, "seed more users than a page holds").toBeLessThan(SEEDED_USERS);

  const table = page.getByRole("table", { name: "Users" });

  await expect(table).toHaveAttribute("aria-busy", "true");
  await expect(table.getByRole("link")).toHaveCount(0);

  release();

  await expect(table.getByRole("link")).toHaveCount(pageSize);
  await expect(table).toHaveAttribute("aria-busy", "false");
  await expect(page.getByText(`Page 1 of ${Math.ceil(SEEDED_USERS / pageSize)} · ${SEEDED_USERS} results`)).toBeVisible();

  await page.getByRole("button", { name: "Next" }).click();

  await expect(page).toHaveURL(/[?&]page=2(&|$)/);

  await expect(table.getByRole("link")).toHaveCount(Math.min(pageSize, SEEDED_USERS - pageSize));

  expect(new URL(page.url()).searchParams.get("search")).toBe(RUN);

  // A new search starts again from the first page.
  await page.getByLabel("Search").fill(emailOf("03"));

  await expect(table.getByRole("link")).toHaveCount(1);
  await expect(table.getByRole("link", { name: `${RUN} user 03` })).toBeVisible();

  expect(new URL(page.url()).searchParams.get("search")).toBe(emailOf("03"));
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
});

test("creating a user blocks the screen until it is saved, then edits it with a form that mounts filled", async ({ page }) => {
  const release = await holdRequests(page, (request: Request): boolean => request.method() === "POST" && isUsersCollection(request));

  await page.goto("/users/new");

  await page.getByLabel("Name").fill(`${RUN} created`);
  await page.getByLabel("Email").fill(emailOf("created"));
  await page.getByLabel("Password").fill(E2E_USER_PASSWORD);

  // A language chosen and then taken back: the select started at `null` and returns to it.
  const language = page.getByRole("combobox", { name: "Language" });

  await language.click();
  await page.getByRole("option", { name: "Español" }).click();

  await expect(language).toContainText("Español");

  await language.click();
  await page.getByRole("option", { name: "The application's default" }).click();

  await expect(language).toContainText("The application's default");

  const createRequest = page.waitForRequest((request: Request): boolean => request.method() === "POST" && isUsersCollection(request));

  await page.getByRole("button", { name: "Create user" }).click();

  // No choice is no property: the account gets the backend's default language.
  expect((await createRequest).postDataJSON()).toEqual({ name: `${RUN} created`, email: emailOf("created"), password: E2E_USER_PASSWORD });

  await expect(page.getByRole("status", { name: "Saving…" })).toBeVisible();

  release();

  await expect(page).toHaveURL(USER_DETAIL_URL);

  createdIds.push(idFromUrl(page));

  await expect(page.getByRole("status", { name: "Saving…" })).toBeHidden();
  await expect(page.getByText(emailOf("created"))).toBeVisible();

  // The list was invalidated, so it has the new user without a reload.
  await page.getByRole("link", { name: "All users" }).click();
  await page.getByLabel("Search").fill(emailOf("created"));

  await expect(page.getByRole("link", { name: `${RUN} created` })).toBeVisible();

  await page.getByRole("link", { name: `${RUN} created` }).click();
  await page.getByRole("link", { name: "Edit" }).click();

  const email = page.getByLabel("Email");

  await expect(email).toHaveValue(emailOf("created"));

  await email.fill(emailOf("edited"));

  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL(USER_DETAIL_URL);

  await expect(page.getByText(emailOf("edited"))).toBeVisible();
});

test("an email already registered is a toast that closes itself and copies the whole report", async ({ page }) => {
  await page.goto("/users/new");

  await page.getByLabel("Name").fill(`${RUN} duplicate`);
  await page.getByLabel("Email").fill(emailOf("01"));
  await page.getByLabel("Password").fill(E2E_USER_PASSWORD);

  const conflict = page.waitForResponse((response: Response): boolean => isUsersCreation(response));

  await page.getByRole("button", { name: "Create user" }).click();

  const response = await conflict;
  const traceId = response.headers()[TRACE_ID_HEADER];

  const toast = page.locator("[data-slot=toast]");

  expect(response.status()).toBe(409);

  if (traceId === undefined) {
    throw new Error(`The backend answered the conflict without ${TRACE_ID_HEADER}`);
  }

  await expect(toast).toBeVisible();
  await expect(toast).not.toContainText(traceId);
  await expect(toast).not.toContainText("users.email_already_registered");

  // Left alone — nothing hovers or focuses it — it goes away on its own.
  await expect(toast).toHaveCount(0, { timeout: TOAST_GONE_TIMEOUT_MS });

  // The report copied is this second attempt's, with its own trace id.
  const secondConflict = page.waitForResponse((response: Response): boolean => isUsersCreation(response));

  await page.getByRole("button", { name: "Create user" }).click();

  const reportedTraceId = (await secondConflict).headers()[TRACE_ID_HEADER];

  const copy = toast.getByRole("button", { name: "Copy error", includeHidden: true });

  await copy.click();

  await expect(toast.getByRole("button", { name: "Copied", includeHidden: true })).toBeDisabled();

  const report: unknown = JSON.parse(await page.evaluate((): Promise<string> => navigator.clipboard.readText()));

  expect(report).toEqual({
    method: "POST",
    url: expect.stringContaining(USERS_COLLECTION_PATH),
    status: 409,
    code: "users.email_already_registered",
    title: expect.any(String),
    detail: expect.any(String),
    errors: [],
    traceId: reportedTraceId,
    timestamp: expect.any(String),
  });
});

test("the backend's field errors land on the fields they name", async ({ page }) => {
  await page.goto("/users/new");

  await page.getByLabel("Name").fill("n".repeat(NAME_MAX_LENGTH + 1));
  await page.getByLabel("Email").fill(emailOf("too-long"));
  await page.getByLabel("Password").fill("p".repeat(PASSWORD_MAX_BYTES + 1));

  const rejected = page.waitForResponse((response: Response): boolean => isUsersCreation(response));

  await page.getByRole("button", { name: "Create user" }).click();

  expect((await rejected).status()).toBe(400);

  for (const label of ["Name", "Password"]) {
    const field = page.getByLabel(label);

    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveAccessibleDescription(/\S/);
  }

  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("[data-slot=toast]")).toHaveCount(0);
});
