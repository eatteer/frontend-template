import type { AuthTokensDTO } from "@/common/api/schema.gen";

// What a sign-in or a refresh answers to a cookie client: the tokens are in the cookies, not the body.
export function buildAuthTokensDTO(overrides: Partial<AuthTokensDTO> = {}): AuthTokensDTO {
  return {
    accessToken: null,
    refreshToken: null,
    expiresAt: "2026-10-26T00:00:00.000Z",
    ...overrides,
  };
}
