import type { SessionDTO, SessionUserDTO } from "@/common/api/schema.gen";

// The backend's catalog, generated from its OpenAPI: a permission it renames or drops is a compile
// error at every check that names it, instead of a gate that is silently always closed.
export type Permission = SessionDTO["permissions"][number];

export type SessionUser = SessionUserDTO;

export type Session = {
  user: SessionUser;
  // The ones the access token carries: what the API allows until the next refresh.
  permissions: Permission[];
  accessTokenExpiresAt: Date;
};

// Every one of them, not any: a check naming two permissions needs both.
export function hasPermissions(session: Session, required: readonly Permission[]): boolean {
  return required.every((permission: Permission): boolean => session.permissions.includes(permission));
}
