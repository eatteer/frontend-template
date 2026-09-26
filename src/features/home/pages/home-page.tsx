import { useTranslation } from "react-i18next";

import type { JSX } from "react";

export function HomePage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-2 py-12">
      <h1 className="font-heading text-2xl font-semibold">{t("home.title")}</h1>
      <p className="text-muted-foreground">{t("home.description")}</p>
    </section>
  );
}
