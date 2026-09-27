import { Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ThemeMenu } from "@/common/components/theme/theme-menu";

import type { JSX, ReactNode } from "react";

// Both menus are passed in by the route, since the shell is shared and they act on the account, which
// belongs to a feature.
type AppShellProps = {
  languageMenu: ReactNode;
  userMenu: ReactNode;
};

export function AppShell({ languageMenu, userMenu }: AppShellProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <Link to="/" className="font-heading font-semibold">{t("app_name")}</Link>

        <div className="ml-auto flex items-center gap-1">
          {languageMenu}
          <ThemeMenu />
          {userMenu}
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
