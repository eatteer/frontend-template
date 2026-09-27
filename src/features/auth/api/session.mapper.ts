import type { SessionDto } from "@/common/api/schema.gen";
import type { Session } from "@/features/auth/model/session";

// The access token's expiry stays behind: the refresh is reactive, and nothing reads it.
export function toSession(dto: SessionDto): Session {
  const { id, name, email, preferredLanguage } = dto.user;

  return {
    user: { id, name, email, preferredLanguage },
    permissions: dto.permissions,
  };
}
