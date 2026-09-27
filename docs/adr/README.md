# Architecture decision records

One file per decision that shaped this codebase and that somebody would otherwise have to
reconstruct from the code: what was decided, what else was on the table, and what it costs. The
format is [MADR 4](https://adr.github.io/madr/); [`adr-template.md`](adr-template.md) is the
skeleton for the next one.

A record is not edited to change its decision. A decision that changes gets a new record, and the
old one's status becomes `superseded by NNNN` — so the reasoning that was true at the time stays
readable next to the reasoning that replaced it. A record's `date` is the day the decision was
accepted.

A record states this project's choice. Where the choice follows a rule a skill of the
`frontend-architecture` plugin owns, it names the skill instead of restating the argument. A
decision the backend made — the session endpoint, same-site cookies — is backend-template's record,
linked rather than repeated.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-session-read-from-the-api.md) | The browser reads its session from the API, and never holds a token | accepted |
| [0002](0002-refresh-once-across-tabs.md) | A refresh happens when a request is refused, and once across every tab | accepted |
| [0003](0003-types-generated-from-openapi.md) | The API's types come from its OpenAPI document, through a single client | accepted |
| [0004](0004-only-writes-block-the-screen.md) | Only a write blocks the screen; a read shows a skeleton in place | accepted |
| [0005](0005-shadcn-on-base-ui.md) | The UI primitives are shadcn on Base UI, and the whole catalog lives in the repository | accepted |
| [0006](0006-toasts-are-base-ui.md) | Toasts are Base UI's, not sonner | accepted |
| [0007](0007-react-compiler-outside-vitest.md) | The React Compiler builds the application, but not the component tests | accepted |
| [0008](0008-e2e-against-the-build-and-the-real-backend.md) | The end-to-end suite runs the production build against the real backend | accepted |
| [0009](0009-api-address-fixed-at-build.md) | The API's address is fixed when the image is built | accepted |
