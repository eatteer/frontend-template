import type { SessionDto } from "@/common/api/schema.gen";
import type { Language } from "@/common/i18n/languages";

// The backend's catalog, generated from its OpenAPI: a permission it renames or drops is a compile
// error at every check that names it, instead of a gate that is silently always closed.
export type Permission = SessionDto["permissions"][number];

// What the application shows of the signed-in account, declared here so a field the backend adds
// reaches no screen until one asks for it.
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  preferredLanguage: Language;
};

export type Session = {
  user: SessionUser;
  // The ones the access token carries: what the API allows until the next refresh.
  permissions: Permission[];
};

// Every one of them, not any: a check naming two permissions needs both.
export function hasPermissions(session: Session, required: readonly Permission[]): boolean {
  return required.every((permission: Permission): boolean => session.permissions.includes(permission));
}
