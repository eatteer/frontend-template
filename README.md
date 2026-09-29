# frontend-template

A React + TypeScript + Vite single-page application, built against
[backend-template](https://github.com/eatteer/backend-template): its Problem Details, its
cookie sessions and its paginated lists work from the first run. Clone it, run it, and start adding
features.

## Configuration

One `.env`: `cp .env.example .env` and fill it in. Every variable is validated when the bundle loads
(`src/common/config/env.ts`), and a missing or malformed one stops the application with a message
naming it.

**Everything prefixed `VITE_` is compiled into the bundle and readable by anyone who loads the
page.** It is configuration, never a secret. Today there is one: `VITE_API_URL`, where
backend-template listens.

The front end and the API have to be **same-site**: the session cookies are `SameSite=strict`, and a
cross-site page never sends them. `localhost:5173` calling `localhost:3000` is same-site; so is
`app.example.com` calling `api.example.com`.

## Requirements

- Node — the version in `.nvmrc`
- [backend-template](https://github.com/eatteer/backend-template) running, migrated and seeded, with
  this application's origin in its `CORS_ORIGIN`
- Docker, only to build the deployable image

## Getting started

```bash
cp .env.example .env          # VITE_API_URL is where backend-template listens
npm install
npm run dev
```

Then open `http://localhost:5173` and sign in as the administrator the backend's seed created.

After a change to the backend's API, regenerate its types with the backend running:

```bash
npm run api:types             # writes src/common/api/schema.gen.ts, which is committed
```

## Scripts

| Script | Does | Needs |
| --- | --- | --- |
| `npm run dev` | The dev server, with hot reload | the backend |
| `npm run build` | The production bundle, in `dist/` | |
| `npm run preview` | Serves `dist/` | `build` |
| `npm run lint` | ESLint with `--fix`; it owns formatting | |
| `npm run typecheck` | `tsc -b`, over the application, the tests and the tooling | |
| `npm test` | Unit and component tests with Vitest, and the coverage floor. The network is MSW; nothing runs | |
| `npm run api:types` | Regenerates the API's types from its OpenAPI document | the backend |

**The component tests fail on any console error or warning.** React reports what it considers a bug
— an input switching from uncontrolled to controlled, a missing key — through the console and keeps
rendering, so a test asserting on the screen would pass.

A pre-commit hook runs the linter on staged files and then a full typecheck — `lint-staged` only
sees the staged files, so it cannot catch a cross-file type error.

## Deploying

The `Dockerfile` builds the image: the bundle compiled in a Node stage, then served by nginx running
as an unprivileged user on port 8080. The API's address is compiled in, so it is a build argument,
and the image is built once per environment:

```bash
docker build --build-arg VITE_API_URL=https://api.example.com -t frontend-template .
docker run -p 8080:8080 frontend-template
```

`nginx.conf` is the whole server: any path that is not a file gets `index.html`, for the router;
`index.html` is revalidated on every load, since it names the current assets; `/assets/` is cached
for a year, because a file's name changes with its content; and a missing asset is a 404, so a page
left open across a deployment notices and reloads. It sends a strict Content-Security-Policy — this
origin's scripts and styles, requests to the API alone, no framing — and the usual hardening headers.
HSTS is for whatever terminates TLS in front of it.

**Image size: 83 MB** (measured 2026-09-26). Measure it again when the base image changes.

**Before a release, run the image and use it** with the browser's developer tools open: sign in, go
through the screens the release touches, reload on a deep link. No test runs what ships — the tests
render the source in jsdom, without the React Compiler and without the Content-Security-Policy — so
this is where both show: the console stays empty apart from the line Chrome writes for each 4xx a
flow provokes on purpose, and the Issues panel lists no policy violation.

**Errors the application did not expect go through one port**, `src/common/lib/error-reporter.ts`:
what an error boundary caught, a query that threw something other than the server's answer, an
exception or a rejection nothing handled. With no provider it writes them to the console, which is
also what fails the test suites. To send them to Sentry, Datadog or an endpoint of your own, call
`setErrorReporter` in `main.tsx` before the first render. A failed request is not reported — the
screen shows it, and the backend logged it under the trace id the "Copy error" report carries.

**Web Vitals go through a port of their own**, `src/common/lib/web-vitals.ts`: how long the main
content took to appear, how much the layout moved, how long an interaction waited, measured in the
reader's browser. With no provider nothing is sent. To collect them, call `setWebVitalsReporter` in
`main.tsx` before the first render. A provider on another origin also needs that origin in the
`connect-src` of `nginx.conf`, or the Content-Security-Policy refuses its requests — the same holds
for an error reporter.

## Layout

```text
src/
├── common/        generic primitives: the API client, the query client, the UI catalog, i18n
├── features/      one self-contained slice per feature
├── locales/       one folder per language, one file per namespace
├── routes/        thin route files: guards and loaders, rendering a feature's page
├── main.tsx
└── router.ts
test/              the Vitest setup, MSW handlers and builders
```

A feature owns its `api/` (queries, mutations, mappers), `components/`, `pages/`, `schemas/` and
`model/`. `common/` holds what is **generic**, not what is merely shared, and never imports from a
feature.

## Conventions

They live in the `frontend-architecture` plugin's skills. The plugin's README lists them and what
each one owns.

Working without Claude Code? Read them at
[eatteer/architecture-marketplace](https://github.com/eatteer/architecture-marketplace).

## Answers already given

Each is a decision every front end has to make, and leaving one unstated is the actual defect. Each
has a record in [`docs/adr/`](docs/adr/README.md) with what was weighed and what it costs.

| The answer | Record |
| --- | --- |
| The browser reads its session from the API and never holds a token | [0001](docs/adr/0001-session-read-from-the-api.md) |
| A refresh happens when a request is refused, and once across every tab | [0002](docs/adr/0002-refresh-once-across-tabs.md) |
| The API's types are generated from its OpenAPI document, and there is one client | [0003](docs/adr/0003-types-generated-from-openapi.md) |
| Only a write blocks the screen; a read shows a skeleton in place | [0004](docs/adr/0004-only-writes-block-the-screen.md) |
| The application is tested without an end-to-end suite | [0010](docs/adr/0010-no-end-to-end-suite.md) |
| The API's address is fixed when the image is built | [0009](docs/adr/0009-api-address-fixed-at-build.md) |

The rest cover the stack: shadcn on Base UI, with the whole catalog in the repository
([0005](docs/adr/0005-shadcn-on-base-ui.md)), Base UI's toasts
([0006](docs/adr/0006-toasts-are-base-ui.md)) and the React Compiler, which the component tests run
without ([0007](docs/adr/0007-react-compiler-outside-vitest.md)).

## Adding a feature

The `adding-feature` skill of the `frontend-architecture` plugin has the steps in order and the
checklist that closes them; with Claude Code it loads on its own when you ask for a feature. The
shape it produces:

1. `src/features/<name>/` — the model and the mapper from the API's generated types first, then the
   query options and mutations, then the components and pages.
2. Route files under `src/routes/`, validating their search params and gating on the permissions the
   feature needs.
3. Its translations under `src/locales/<language>/<name>.json`, registered in
   `src/common/i18n/i18next.d.ts`.
4. Component tests with MSW for each screen.

`users` is the example to read: a paginated list with its filters in the URL, a create form whose
server errors land on its fields, a detail page and an edit form that mounts already filled.

## Starting a real project

1. Run `/frontend-architecture:adopt-template` — the skill the plugin ships for this, which never
   runs on its own. It asks for the project's name and a one-line description, and writes them
   everywhere `frontend-template` appears.
2. Point `VITE_API_URL` at your backend, and regenerate the API's types.
3. Keep `users` if your product manages accounts from the browser, or delete it like any other
   feature. `auth` stays: it is how the application signs in.
4. Replace `features/home` with your first screen.
5. Install an error reporter and a Web Vitals reporter (see "Deploying").
6. Add continuous integration. There is none here, because a template deploys nothing, and the
   commands it needs are already the scripts above: `lint`, `typecheck`, `test`. Until
   it exists the only gate is the pre-commit hook, which anyone can skip with `--no-verify`.
