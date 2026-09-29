---
status: accepted
date: 2026-09-29
---

# 0010. The application is tested without an end-to-end suite

## Context and problem statement

An end-to-end suite that drives the build against backend-template needs that backend running,
migrated and seeded, with the suite's origin in its `CORS_ORIGIN`. It writes into the database the
developer works in, spends the administrator's sign-in limit, and needs `E2E_*` variables in `.env`
that describe no environment the application is deployed to. Is that cost worth what the suite
proves beyond the component tests?

## Considered options

- No end-to-end suite: Vitest, Testing Library and MSW, and the served image checked by hand before a
  release
- The Playwright suite against the build and the developer's backend (0008)
- The Playwright suite against a backend of its own, started on a database of its own

## Decision outcome

Chosen option: no end-to-end suite, because the component tests already cover every screen and
what reaches the backend, and the backend's own end-to-end suite covers the API against its own
database. A test run needs nothing running and touches no database, and `.env` holds only the
`VITE_*` configuration of an environment. The rule is the `frontend-architecture` plugin's
(`testing`, `deployment`).

### Consequences

- Good, because `npm test` is the whole suite: nothing to start, no data left behind, no variables
  that exist only for a test.
- Bad, because no test runs what ships. The compiled output ([0007](0007-react-compiler-outside-vitest.md)),
  the image's real Content-Security-Policy, and the refresh across tabs against the real backend
  ([0002](0002-refresh-once-across-tabs.md)) are checked by hand, by running the image before a
  release — see "Deploying" in the README.
- Bad, because a disagreement between the application and backend-template that the network mock
  does not model shows only in that check, or in use.

## More information

Supersedes [0008](0008-e2e-against-the-build-and-the-real-backend.md). Worth revisiting when the
project has continuous integration that can start backend-template on a database of its own.
