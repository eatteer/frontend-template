---
status: accepted
date: 2026-09-26
---

# 0001. The browser reads its session from the API, and never holds a token

## Context and problem statement

backend-template signs a browser in with `HttpOnly` cookies, so no script can read the tokens. The
application still has to know who is signed in and what they may do: to render a user menu, to
hide a button, to show a reader without a permission a page that says so.

## Considered options

- Ask the API: `GET /auth/session` on load and after every refresh, kept in the query cache
- Keep the user and permissions from the sign-in response in `localStorage`
- Ask for the tokens in the body (`transport: "header"`) and decode the JWT in the browser

## Decision outcome

Chosen option: ask the API, because it is the only one that survives a reload and still shows what
the API enforces. The endpoint exists for this client
([backend-template ADR 0018](https://github.com/eatteer/backend-template/blob/main/docs/adr/0018-browser-reads-its-session-from-an-endpoint.md)).

- The session is one query, read by the route guards and by every component that gates on a
  permission. There is no second copy in a store or in storage.
- The permission catalog is the type the OpenAPI document generates, so a permission the backend
  renames stops compiling here.
- Signing out, or a refresh that fails, clears the whole query cache: whatever the last reader
  loaded leaves with them.

Keeping the sign-in response loses it on reload and never learns about a refresh. Handing the token
to JavaScript is exactly what `HttpOnly` exists to prevent: one XSS and the session leaves the
browser.

### Consequences

- Good, because a script injected into the page cannot read or send the tokens anywhere, and the
  screen never shows a permission the API would refuse.
- Bad, because every load pays for one request before the first guarded route renders, and an
  anonymous visitor costs two 401s — the session, and the refresh that tries to rescue it — since
  the page cannot tell whether a refresh cookie exists.
- Bad, because cookies require the front end and the API to be same-site
  ([backend-template ADR 0003](https://github.com/eatteer/backend-template/blob/main/docs/adr/0003-same-site-cookie-authentication.md)).

## More information

`features/auth/api/session-queries.ts`, `session-guards.ts` and `use-session.ts`. `SessionSync` is
the one place a session ends.
