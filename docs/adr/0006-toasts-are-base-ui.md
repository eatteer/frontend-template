---
status: accepted
date: 2026-09-26
---

# 0006. Toasts are Base UI's, not sonner

## Context and problem statement

Errors reach the reader as toasts. shadcn's catalog offered sonner, which read the theme through
`next-themes` — a package for another framework — while the registry's Base UI style already
shipped a toast built on `@base-ui/react/toast`.

## Considered options

- Base UI's toast (`common/ui/toast.tsx`)
- sonner, wired to the application's own theme provider

## Decision outcome

Chosen option: Base UI's toast, because it is the same library as every other primitive, it paints
with the theme's CSS variables with no provider to connect, and it announces a high-priority toast
through an assertive live region.

An error toast closes on its own after `ERROR_TOAST_TIMEOUT_MS` and shows no id. Its "Copy error"
puts the whole report on the clipboard: method, URL, status, code, title, detail, field errors,
trace id and time.

### Consequences

- Good, because sonner and `next-themes` left the dependencies.
- Bad, because with high priority, Base UI hides the visual toast from assistive technology and
  announces it from a separate region, so a test finds its buttons among hidden elements.

## More information

`common/components/error-toast.ts` and `app-toaster.tsx`.
