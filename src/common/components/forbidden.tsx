import { Link } from "@tanstack/react-router";
import { LockIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { buttonVariants } from "@/common/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/common/ui/empty";

import type { JSX } from "react";

// Said plainly rather than disguised as a missing page: the backend answers 403 too, and a reader
// who knows they lack a permission knows whom to ask for it. No retry — asking again changes nothing.
export function Forbidden(): JSX.Element {
  const { t } = useTranslation();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockIcon aria-hidden="true" />
        </EmptyMedia>

        <EmptyTitle>{t("forbidden.title")}</EmptyTitle>
        <EmptyDescription>{t("forbidden.detail")}</EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <Link to="/" className={buttonVariants()}>{t("actions.goHome")}</Link>
      </EmptyContent>
    </Empty>
  );
}
