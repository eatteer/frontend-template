import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useHasPermissions } from "@/features/auth/api/use-session";

import type { JSX } from "react";

// Only for someone who may read the list: a link to a page that answers "no access" is a dead end.
export function UsersNavLink(): JSX.Element | null {
  const { t } = useTranslation("users");

  const canReadUsers = useHasPermissions(["users:read"]);

  if (!canReadUsers) {
    return null;
  }

  return (
    <Link
      to="/users"
      className="
        text-sm text-muted-foreground
        hover:text-foreground
        data-[status=active]:font-medium data-[status=active]:text-foreground
      "
    >
      {t("nav")}
    </Link>
  );
}
