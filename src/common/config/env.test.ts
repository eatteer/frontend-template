import { describe, expect, it } from "vitest";

import { parseEnv } from "@/common/config/env";

describe("parseEnv", () => {
  it("returns the variables it validated", () => {
    expect(parseEnv({ VITE_API_URL: "http://localhost:3000" })).toEqual({ VITE_API_URL: "http://localhost:3000" });
  });

  it("names the variable that is missing", () => {
    expect(() => parseEnv({})).toThrow(/VITE_API_URL/);
  });

  it("rejects a value that is not a URL", () => {
    expect(() => parseEnv({ VITE_API_URL: "localhost" })).toThrow(/Invalid environment variables/);
  });
});
