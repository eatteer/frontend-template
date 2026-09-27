import { setAccountLanguage } from "./support/api";
import { ADMIN_STORAGE_STATE, e2eEnv } from "./support/env";
import { expect, test } from "./support/fixtures";

// Signs in once per run through the real form, and leaves the cookies for every spec that follows:
// the backend allows a handful of sign-ins per account every few minutes.
test("an anonymous visitor signs in and comes back to the page they asked for", async ({ page }) => {
  await page.goto("/users");

  await expect(page).toHaveURL("/sign-in?redirect=%2Fusers");

  await page.getByLabel("Email").fill(e2eEnv.E2E_ADMIN_EMAIL);
  await page.getByLabel("Password").fill(e2eEnv.E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/users");
  await expect(page.getByRole("heading", { name: /^(Users|Usuarios)$/ })).toBeVisible();

  // Once signed in, the account's language decides the screen's, and the specs read it in English.
  await setAccountLanguage(page.request, "en");
  await page.reload();

  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
