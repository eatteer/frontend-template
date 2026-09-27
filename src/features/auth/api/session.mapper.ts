import type { SessionDTO } from "@/common/api/schema.gen";
import type { Session } from "@/features/auth/model/session";

// The access token's expiry stays behind: the refresh is reactive, and nothing reads it.
export function toSession(dto: SessionDTO): Session {
  const { id, name, email, preferredLanguage } = dto.user;

  return {
    user: { id, name, email, preferredLanguage },
    permissions: dto.permissions,
  };
}
