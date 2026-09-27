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
  it("keeps what the application shows of the account and its permissions, and nothing else", () => {
    const dto = buildSessionDTO();

    expect(toSession(dto)).toEqual({
      user: { id: dto.user.id, name: dto.user.name, email: dto.user.email, preferredLanguage: dto.user.preferredLanguage },
      permissions: dto.permissions,
    });
  });
});
