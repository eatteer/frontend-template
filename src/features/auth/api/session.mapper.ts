import type { SessionDTO } from "@/common/api/schema.gen";
import type { Session } from "@/features/auth/model/session";

export function toSession(dto: SessionDTO): Session {
  return {
    user: dto.user,
    permissions: dto.permissions,
    accessTokenExpiresAt: new Date(dto.accessTokenExpiresAt),
  };
}
