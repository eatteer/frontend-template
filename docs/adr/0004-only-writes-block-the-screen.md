---
status: accepted
date: 2026-09-26
---

# 0004. Only a write blocks the screen; a read shows a skeleton in place

## Context and problem statement

A screen waits for the network in two different situations: while its content loads, and while a
change the reader made is being saved. The reference projects covered both with the same fullscreen
loader, which hid every skeleton and made each navigation feel like a stall.

## Considered options

- A fullscreen loader for mutations only; queries show a skeleton that mirrors the content
- A fullscreen loader for every query and mutation
- No blocking at all

## Decision outcome

Chosen option: block for writes, skeletons for reads.

- `FullscreenLoader` counts pending mutations (`useIsMutating`). A mutation the reader need not
  wait on — changing the language, a toggle — opts out with `meta.fullscreenLoader: false`.
- A query renders one of four states in place — loading, failed, empty, data — and its skeleton is
  a sibling component that mirrors the real layout, so nothing moves when the data arrives.
- A refetch behind data already on screen keeps the data, marked busy, and never goes back to the
  skeleton. Only a failed refetch toasts, since a query that never loaded shows its error in place.

### Consequences

- Good, because nobody submits twice or navigates away from a half-saved change, and reading never
  blocks.
- Bad, because every list and detail screen owns a skeleton to keep in step with its layout.

## More information

`common/components/fullscreen-loader.tsx`, `common/query/query-client.ts`, and the users list and
detail pages.
