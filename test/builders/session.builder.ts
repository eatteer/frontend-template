import type { SessionDTO } from "@/common/api/schema.gen";

// The seeded administrator, as the backend describes them.
export function buildSessionDTO(overrides: Partial<SessionDTO> = {}): SessionDTO {
  return {
    user: {
      id: "01890a5d-ac96-774b-bcce-b302099a8057",
      name: "Admin",
      email: "admin@example.com",
      preferredLanguage: "en",
    },
    permissions: ["users:read", "users:create", "users:update"],
    accessTokenExpiresAt: "2026-09-26T12:15:00.000Z",
    ...overrides,
  };
}
