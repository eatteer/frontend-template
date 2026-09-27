---
status: accepted
date: 2026-09-26
---

# 0009. The API's address is fixed when the image is built

## Context and problem statement

Vite compiles every `VITE_*` variable into the bundle, and the Content-Security-Policy needs the
same address in `connect-src`. Either the image is built for one environment, or the address is
injected when the container starts.

## Considered options

- A build argument: `docker build --build-arg VITE_API_URL=…`, one image per environment
- Configuration at runtime: the container renders a `config.js` and the policy when it starts
- nginx proxies `/api` to the backend, and the application calls its own origin

## Decision outcome

Chosen option: the build argument, because it keeps configuration where Vite puts it, validated by
`common/config/env.ts` like everything else, and the same value writes the policy's `connect-src`.

- The image is nginx running unprivileged and serving the build. `index.html` is revalidated on
  every load, `/assets/` is cached for a year (a file's name changes with its content), any other
  path gets `index.html` for the router, and a missing asset is a 404, so a stale page reloads.
- The headers: a strict Content-Security-Policy (`script-src 'self'`, `style-src 'self'`,
  `frame-ancestors 'none'`), `nosniff`, a referrer policy and a permissions policy. HSTS belongs to
  whatever terminates TLS.

Runtime configuration means a second way of reading configuration and a script in `index.html`
that runs before the bundle. A proxy ties the deployment to one topology, and the backend already
answers CORS for a same-site origin.

### Consequences

- Good, because the image has nothing to configure: it serves files.
- Bad, because the image built for staging is not the one that goes to production: the same commit
  is built twice.

## More information

`Dockerfile` and `nginx.conf`.
