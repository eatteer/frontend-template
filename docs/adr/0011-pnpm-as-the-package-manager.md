---
status: accepted
date: 2026-10-02
---

# 0011. pnpm is the package manager

## Context and problem statement

The projects built from this template live in pnpm workspaces, beside a backend and other
packages. npm lets a module import any package hoisted into `node_modules`, declared or not, so an
import that works here can fail once the code moves into a workspace that does not hoist it.

## Considered options

- pnpm, pinned in `packageManager` and enabled with corepack
- npm, with `package-lock.json`

## Decision outcome

Chosen option: pnpm, because a module sees only the packages its own `package.json` declares, so
the template fails the way a workspace would, and the version every contributor and the image use is
the one `packageManager` pins.

`pnpm-workspace.yaml` holds the install settings: which dependencies may run an install script,
and the peer ranges allowed past what a package declares.

### Consequences

- Good, because an undeclared import fails here, not after the move into a workspace.
- Good, because the image installs with the same pnpm, through corepack, as a contributor does.
- Bad, because a new dependency with an install script fails the install until it is allowed or
  refused in `allowBuilds`, and each entry there needs a reason.

## More information

`package.json` (`packageManager`), `pnpm-workspace.yaml`, the `Dockerfile`'s build stage and the
Git hooks in `.husky/`.
