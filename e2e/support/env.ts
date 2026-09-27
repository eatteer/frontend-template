import { existsSync } from "node:fs";

import { z } from "zod";

// The suite reads the same `.env` the application builds with, so the API it calls directly is the
// one the bundle calls. A variable already in the environment wins, as it does for Vite.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const e2eEnvSchema = z.object({
  VITE_API_URL: z.url(),
  // The administrator backend-template's seed created (its SEED_ADMIN_* variables).
  E2E_ADMIN_EMAIL: z.email(),
  E2E_ADMIN_PASSWORD: z.string().min(1),
  // An application already served elsewhere — the Docker image — instead of building and previewing
  // one. Its origin has to be in the backend's CORS_ORIGIN too.
  E2E_BASE_URL: z.url().optional(),
});

export type E2eEnv = z.infer<typeof e2eEnvSchema>;

function parseE2eEnv(source: NodeJS.ProcessEnv): E2eEnv {
  const result = e2eEnvSchema.safeParse(source);

  if (!result.success) {
    throw new Error(`Invalid end-to-end environment variables:\n${z.prettifyError(result.error)}`);
  }

  return result.data;
}

export const e2eEnv = parseE2eEnv(process.env);

// Not the dev server's port, so the suite runs while `npm run dev` does. The backend's CORS_ORIGIN
// has to list this origin too.
export const PREVIEW_PORT = 4173;
export const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;

// Where the setup project leaves the administrator's cookies for the specs that reuse them.
export const ADMIN_STORAGE_STATE = "playwright/.auth/admin.json";
