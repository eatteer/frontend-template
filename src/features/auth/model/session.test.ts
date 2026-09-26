import { describe, expect, it } from "vitest";

import { toSession } from "@/features/auth/api/session.mapper";
import { hasPermissions } from "@/features/auth/model/session";

import { buildSessionDTO } from "@test/builders/session.builder";

describe("hasPermissions", () => {
  const session = toSession(buildSessionDTO({ permissions: ["users:read", "users:create"] }));

  it("needs every permission it names, not any of them", () => {
    expect(hasPermissions(session, ["users:read", "users:create"])).toBe(true);
    expect(hasPermissions(session, ["users:read", "users:delete"])).toBe(false);
  });

  it("lets through a check that names nothing", () => {
    expect(hasPermissions(session, [])).toBe(true);
  });
});

describe("toSession", () => {
  it("reads the expiry as a date", () => {
    expect(toSession(buildSessionDTO()).accessTokenExpiresAt).toEqual(new Date("2026-09-26T12:15:00.000Z"));
  });
});
