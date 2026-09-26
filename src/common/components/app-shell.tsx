import { Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LanguageMenu } from "@/common/components/language-menu";
import { ThemeMenu } from "@/common/components/theme/theme-menu";

import type { JSX } from "react";

export function AppShell(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <Link to="/" className="font-heading font-semibold">{t("appName")}</Link>

        <div className="ml-auto flex items-center gap-1">
          <LanguageMenu />
          <ThemeMenu />
        </div>
      </header>

      <main className="
        flex-1 p-4
        md:p-6
      "
      >
        <Outlet />
      </main>
    </div>
  );
}
