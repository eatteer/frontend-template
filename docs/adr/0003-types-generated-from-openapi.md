---
status: accepted
date: 2026-09-26
---

# 0003. The API's types come from its OpenAPI document, through a single client

## Context and problem statement

Every request and response has a shape the backend already declares in its OpenAPI document. Typing
them again by hand is a second copy that drifts silently: the backend renames a field, and the
front end compiles and breaks at runtime.

## Considered options

- `openapi-typescript` generates `schema.gen.ts`, and `openapi-fetch` is the only HTTP client
- Hand-written DTOs and a thin `fetch` wrapper
- A generated SDK with one function per operation

## Decision outcome

Chosen option: generated types and `openapi-fetch`, because the path, the query, the body and the
response of every call are checked against the document, with nothing generated but types.

- `npm run api:types` regenerates the file from a running backend, and it is committed: a diff in a
  pull request shows what changed in the contract.
- The value unions the application needs — permissions, statuses, `sortBy` columns — are the arrays
  the generator emits, never retyped.
- The client's middlewares own what every call shares: cookies, `x-lang`, `traceparent`, the
  refresh ([0002](0002-refresh-once-across-tabs.md)), and turning every failure into an `ApiError`
  built from the Problem Details body.
- A feature maps DTOs to its own model in a mapper, so a screen never depends on the wire format.

A generated SDK adds a layer of code nobody reads, and hand-written DTOs are the drift this avoids.

### Consequences

- Good, because a breaking change in the backend is a compile error here, and a query parameter the
  backend does not declare — which it answers with 400 — cannot be sent at all.
- Bad, because regenerating needs the backend running, and the document has to be faithful: a
  nullable property without an explicit type came out as `Record<string, never>` until the backend
  fixed it.

## More information

`common/api/client.ts`, `schema.gen.ts`, `api-error.ts` and `problem-details.ts`.
