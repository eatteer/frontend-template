import { useTranslation } from "react-i18next";

import { Toaster } from "@/common/ui/toast";

import type { JSX } from "react";

export function AppToaster(): JSX.Element {
  const { t } = useTranslation();

  return <Toaster closeLabel={t("actions.close")} />;
}
