import { describe, expect, it } from "vitest";

import { resolveRedirect } from "@/features/auth/model/redirect";

describe("resolveRedirect", () => {
  it("follows a path on this site, query and hash included", () => {
    expect(resolveRedirect("/users?page=2#top")).toBe("/users?page=2#top");
  });

  it.each([
    ["nothing", undefined],
    ["an absolute URL", "https://evil.example/"],
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash the browser reads as a slash", "/\\evil.example"],
    ["a relative path", "users"],
  ])("goes home for %s", (_case: string, redirect: string | undefined) => {
    expect(resolveRedirect(redirect)).toBe("/");
  });
});
