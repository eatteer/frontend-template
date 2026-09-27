import { useTranslation } from "react-i18next";

import type { JSX } from "react";

export function HomePage(): JSX.Element {
  const { t } = useTranslation("home");

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-2 py-12">
      <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
    </section>
  );
}
