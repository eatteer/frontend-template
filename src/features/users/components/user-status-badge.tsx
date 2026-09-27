import { useTranslation } from "react-i18next";

import { Badge } from "@/common/ui/badge";
import type { UserStatus } from "@/features/users/model/user";

import type { JSX } from "react";

const STATUS_VARIANTS: Record<UserStatus, "secondary" | "destructive"> = {
  active: "secondary",
  suspended: "destructive",
};

export function UserStatusBadge({ status }: { status: UserStatus }): JSX.Element {
  const { t } = useTranslation("users");

  return <Badge variant={STATUS_VARIANTS[status]}>{t(`status.${status}`)}</Badge>;
}
