import { expect } from "@playwright/test";

import { e2eEnv } from "./env";

import type { APIRequestContext } from "@playwright/test";

// The backend, called directly: to set up and clean up what a spec needs, never to assert what the
// page should have done.
export function apiUrl(path: string): string {
  return `${e2eEnv.VITE_API_URL}/api/v1${path}`;
}

type CreatedUser = {
  id: string;
  name: string;
  email: string;
};

export async function createUser(request: APIRequestContext, name: string, email: string): Promise<CreatedUser> {
  const response = await request.post(apiUrl("/users"), { data: { name, email, password: "e2e-password" } });

  expect(response.status(), await response.text()).toBe(201);

  const { data } = await response.json() as { data: { id: string } };

  return { id: data.id, name, email };
}

export async function deleteUser(request: APIRequestContext, id: string): Promise<void> {
  const response = await request.delete(apiUrl(`/users/${id}`));

  expect(response.status(), await response.text()).toBe(204);
}

// The suite reads the screen in English, and the account's language decides the screen's once
// signed in. A run that stopped halfway through the language spec could have left it in Spanish.
export async function setAccountLanguage(request: APIRequestContext, preferredLanguage: string): Promise<void> {
  const response = await request.patch(apiUrl("/users/me/preferences"), { data: { preferredLanguage } });

  expect(response.status(), await response.text()).toBe(204);
}

export async function signIn(request: APIRequestContext): Promise<void> {
  const response = await request.post(apiUrl("/auth/login"), {
    data: { email: e2eEnv.E2E_ADMIN_EMAIL, password: e2eEnv.E2E_ADMIN_PASSWORD },
  });

  expect(response.status(), await response.text()).toBe(200);
}
