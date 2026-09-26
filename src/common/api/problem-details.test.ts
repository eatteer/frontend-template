import { describe, expect, it } from "vitest";

import { parseProblemDetails } from "@/common/api/problem-details";

import { buildProblemDetails } from "@test/builders/problem-details.builder";

describe("parseProblemDetails", () => {
  it("accepts the backend's error body", () => {
    const problem = buildProblemDetails({ errors: [{ field: "price.amountMinor", message: "Must be a whole number" }] });

    expect(parseProblemDetails(problem)).toEqual(problem);
  });

  it.each([
    ["nothing", undefined],
    ["an HTML page", "<html>Bad gateway</html>"],
    ["a body missing its code", { ...buildProblemDetails(), code: undefined }],
  ])("rejects %s", (_description: string, body: unknown) => {
    expect(parseProblemDetails(body)).toBeUndefined();
  });
});
