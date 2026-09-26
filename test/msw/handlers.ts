import { signedIn } from "@test/msw/session";

import type { RequestHandler } from "msw";

// The handlers every suite starts from: someone is signed in, so a page behind the session guard
// renders. A test that needs a different answer overrides one with `server.use(...)`, and the
// override is discarded after that test.
export const handlers: RequestHandler[] = [signedIn()];
