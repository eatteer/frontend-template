---
status: accepted
date: 2026-09-26
---

# 0007. The React Compiler builds the application, but not the component tests

## Context and problem statement

The React Compiler memoizes every component, which is why the code has no `useMemo` or
`useCallback`. Under Vitest, the branches it adds — a cache hit on a re-render with the same props —
count as branches of the application's own code: branch coverage fell from 90.5 % to 75.9 % with the
same tests.

## Considered options

- The compiler in `dev` and `build`, not under Vitest; the compiled output tested end to end
- The compiler everywhere, with a lower coverage floor
- No compiler, and manual memoization

## Decision outcome

Chosen option: leave it out of Vitest, because the coverage floor should measure the code written
here, and the compiled bundle is still exercised by the end-to-end suite, which runs against the
production build ([0008](0008-e2e-against-the-build-and-the-real-backend.md)).

### Consequences

- Good, because the floor stays at 90/85/85/90, the same as the backend's.
- Bad, because a bug the compiler introduces shows up only end to end, never in a component test.

## More information

The conditional plugin list in `vite.config.ts`.
