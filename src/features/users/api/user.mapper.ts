import type { UserDTO } from "@/common/api/schema.gen";
import type { User } from "@/features/users/model/user";

// Only what the screens show. The role ids and the deletion date are the backend's; nothing here
// reads them yet.
export function toUser(dto: UserDTO): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    status: dto.status,
    preferredLanguage: dto.preferredLanguage,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
