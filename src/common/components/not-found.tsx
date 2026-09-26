import { Link } from "@tanstack/react-router";
import { FileQuestionIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { buttonVariants } from "@/common/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/common/ui/empty";

import type { JSX } from "react";

export function NotFound(): JSX.Element {
  const { t } = useTranslation();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestionIcon aria-hidden="true" />
        </EmptyMedia>

        <EmptyTitle>{t("notFound.title")}</EmptyTitle>
        <EmptyDescription>{t("notFound.detail")}</EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        {/* Styled as a button, announced as the link it is: it navigates. */}
        <Link to="/" className={buttonVariants()}>{t("actions.goHome")}</Link>
      </EmptyContent>
    </Empty>
  );
}
