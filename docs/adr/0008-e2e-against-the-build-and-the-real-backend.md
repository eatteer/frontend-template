---
status: superseded by 0010
date: 2026-09-26
---

# 0008. The end-to-end suite runs the production build against the real backend

## Context and problem statement

Component tests answer requests with MSW, so they cannot tell whether the application and
backend-template agree: on the query parameters a list sends, on the cookies, on a refresh racing
across tabs. Something has to run the two together.

## Considered options

- Playwright against `vite preview` of the production build and a running backend-template
- Playwright against the dev server
- Playwright with the network mocked

## Decision outcome

Chosen option: the production build against the real backend.

- The build is what ships, with the React Compiler and without development-only warnings: outside
  production the router writes a console warning for every route that fails on purpose, and the
  suite fails on any console error or warning, as the component tests do.
- The backend is the developer's local one. The suite signs in as the seeded administrator once per
  run and reuses the cookies, because sign-ins are rate-limited per account. The test that exercises
  the refresh signs in on its own, since rotating the shared refresh token would end the others'
  session.
- What a spec creates carries a per-run tag and is deleted when the file finishes, so a run neither
  depends on nor leaves behind data.
- `E2E_BASE_URL` points the same suite at an application served elsewhere — the Docker image — and
  so tests the image's headers and Content-Security-Policy too.

The dev server is not what ships, and a mocked network is what the component tests already do.

### Consequences

- Good, because the suite proves the contract, not a model of it.
- Bad, because it needs backend-template running, migrated and seeded, with this origin in its
  `CORS_ORIGIN`, and the administrator's sign-in limit allows a few runs every fifteen minutes.

## More information

`playwright.config.ts` and `e2e/`.
