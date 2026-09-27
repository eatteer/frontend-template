import type { UserDTO } from "@/common/api/schema.gen";

export function buildUserDTO(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: "01890a5d-ac96-774b-bcce-b302099a8060",
    name: "Jane Doe",
    email: "jane@example.com",
    status: "active",
    roleIds: [],
    preferredLanguage: "en",
    createdAt: "2026-01-15T10:30:00.000Z",
    updatedAt: "2026-01-20T14:45:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

// `count` users, numbered from 1 and created a day apart, newest last.
export function buildUserDTOs(count: number): UserDTO[] {
  return Array.from({ length: count }, (_: unknown, index: number): UserDTO => {
    const number = String(index + 1).padStart(2, "0");

    return buildUserDTO({
      id: `01890a5d-ac96-774b-bcce-b3020990${number}`,
      name: `User ${number}`,
      email: `user${number}@example.com`,
      createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    });
  });
}
