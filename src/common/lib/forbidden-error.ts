// Thrown by a route the reader's permissions do not open. Neither a bug nor a failed request: the
// route's error component shows it for what it is.
export class ForbiddenError extends Error {
  public override readonly name = "ForbiddenError";

  public constructor() {
    super("The session lacks a permission this route requires");
  }
}
