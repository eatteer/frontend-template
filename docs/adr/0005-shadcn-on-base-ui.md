---
status: accepted
date: 2026-09-26
---

# 0005. The UI primitives are shadcn on Base UI, and the whole catalog lives in the repository

## Context and problem statement

An application needs accessible primitives — dialogs, menus, selects, toasts — and a way to own
their markup and styles. shadcn copies components into the repository instead of installing them,
and offers them on two headless libraries: Radix and Base UI.

## Considered options

- shadcn on Base UI (`base-nova`), every component of the registry copied into `common/ui/`
- shadcn on Radix
- Components added one by one as a feature needs them

## Decision outcome

Chosen option: Base UI, with the whole catalog, because the reference projects had drifted into
both libraries at once, and a component needed in a hurry should already be there, already
conforming.

- `common/ui/` is added with `shadcn add --all` and then made to pass the same lint and typecheck as
  everything else: nothing is excluded from ESLint.
- ESLint forbids importing `radix-ui` and `@radix-ui/*`.
- Coverage excludes `common/ui/`, which is library code, and a test imports every module, so a
  broken dependency fails the suite even for a component nobody uses yet.
- A component the application does not import costs nothing: the bundler leaves it out.

### Consequences

- Good, because there is one headless library, with one API (`render` instead of `asChild`), and no
  component is ever missing.
- Bad, because updating a component is a manual merge of the registry's version with the lint fixes
  applied here.
- Bad, because a few Base UI components render an inline `<style>` that the Content-Security-Policy
  refuses. `CSPProvider disableStyleElements` turns those elements off and `styles.css` carries their
  rule ([0009](0009-api-address-fixed-at-build.md)).

## More information

`components.json`, `src/common/ui/` and `test/ui-catalog.test.ts`.
