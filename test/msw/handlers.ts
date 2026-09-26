import type { RequestHandler } from "msw";

// The handlers every suite starts from. A test that needs a different answer overrides one with
// `server.use(...)`, and the override is discarded after that test.
export const handlers: RequestHandler[] = [];
