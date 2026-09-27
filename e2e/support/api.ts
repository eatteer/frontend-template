import { expect } from "@playwright/test";
import { z } from "zod";

import { e2eEnv } from "./env";

import type { APIRequestContext } from "@playwright/test";

// The backend, called directly: to set up and clean up what a spec needs, never to assert what the
// page should have done.
export function apiUrl(path: string): string {
  return `${e2eEnv.VITE_API_URL}/api/v1${path}`;
}

// The backend's names for what the suite inspects on its answers (backend-template's auth-cookies.ts
// and resolve-trace-id.ts).
export const ACCESS_TOKEN_COOKIE = "access_token";
export const TRACE_ID_HEADER = "x-trace-id";

// Every user a spec creates signs in with it, whether through the form or directly.
export const E2E_USER_PASSWORD = "e2e-password";

const createdSchema = z.object({ data: z.object({ id: z.string() }) });

type CreatedUser = {
  id: string;
  name: string;
  email: string;
};

export async function createUser(request: APIRequestContext, name: string, email: string): Promise<CreatedUser> {
  const response = await request.post(apiUrl("/users"), { data: { name, email, password: E2E_USER_PASSWORD } });

  expect(response.status(), await response.text()).toBe(201);

  const { data } = createdSchema.parse(await response.json());

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

// The role backend-template's seed creates with every permission.
const ADMINISTRATOR_ROLE_NAME = "Administrator";

const rolesSchema = z.object({ data: z.array(z.object({ id: z.string(), name: z.string() })) });

// Gives a user every permission, so a spec can spend that account's sign-ins instead of the
// administrator's, which the backend limits per account.
export async function makeAdministrator(request: APIRequestContext, userId: string): Promise<void> {
  const rolesResponse = await request.get(apiUrl("/roles"), { params: { search: ADMINISTRATOR_ROLE_NAME } });

  expect(rolesResponse.status(), await rolesResponse.text()).toBe(200);

  const { data: roles } = rolesSchema.parse(await rolesResponse.json());
  const role = roles.find(({ name }: { name: string }): boolean => name === ADMINISTRATOR_ROLE_NAME);

  if (role === undefined) {
    throw new Error(`The backend has no ${ADMINISTRATOR_ROLE_NAME} role: was it seeded?`);
  }

  const response = await request.patch(apiUrl(`/users/${userId}/roles`), { data: { roleIds: [role.id] } });

  expect(response.status(), await response.text()).toBe(204);
}

type Credentials = {
  email: string;
  password: string;
};

const ADMIN_CREDENTIALS: Credentials = { email: e2eEnv.E2E_ADMIN_EMAIL, password: e2eEnv.E2E_ADMIN_PASSWORD };

export async function signIn(request: APIRequestContext, credentials: Credentials = ADMIN_CREDENTIALS): Promise<void> {
  const response = await request.post(apiUrl("/auth/login"), { data: credentials });

  expect(response.status(), await response.text()).toBe(200);
}
