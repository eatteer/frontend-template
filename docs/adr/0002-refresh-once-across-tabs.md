---
status: accepted
date: 2026-09-26
---

# 0002. A refresh happens when a request is refused, and once across every tab

## Context and problem statement

The access token lives fifteen minutes, and each refresh token can be used exactly once: the
backend treats a second presentation as theft and revokes the whole sign-in. Several requests, in
several tabs, routinely hit the same expired token at the same moment.

## Considered options

- Reactive: refresh when a request answers 401, one refresh at a time across tabs (Web Locks), and
  send the refused request again
- Proactive: a timer refreshes shortly before `accessTokenExpiresAt`
- Refresh on every 401, independently in each tab

## Decision outcome

Chosen option: reactive and single-flight, because it refreshes only when the token is actually
refused and never presents the same refresh token twice.

- The refresh lives in the transport (`common/api/session-refresh.ts`), as an `openapi-fetch`
  middleware: it is part of speaking to this backend, not a feature.
- Within a tab, callers share the promise already in flight. Across tabs, a Web Lock queues them,
  and whoever gets the lock after another tab refreshed finds a refresh newer than its own request
  and only sends the request again.
- A refresh refused with 401 ends the session in every tab. Any other failure — no connection, a
  429, a 5xx — reaches the caller as it is: nobody is signed out for a dropped connection.
- Sign-in, sign-out and each refresh are broadcast to the other tabs (`BroadcastChannel`).

A timer refreshes tokens nobody is using, and still needs the reactive path for a laptop that wakes
from sleep. Refreshing independently in each tab is the one thing the backend punishes.

### Consequences

- Good, because the backend's reuse detection never fires on the application's own behaviour.
- Bad, because the first request after fifteen idle minutes waits for one more round trip.
- Bad, because a browser without Web Locks is single-flight within the tab only.

## More information

`createRefreshCoordinator` and `createSessionRefreshMiddleware`. The end-to-end suite drops the
access cookie, reloads two tabs at once, and expects exactly one `POST /auth/refresh`.
