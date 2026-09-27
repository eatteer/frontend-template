import { Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ThemeMenu } from "@/common/components/theme/theme-menu";

import type { JSX, ReactNode } from "react";

// The navigation and both menus are passed in by the route: the shell is shared, and what they show
// belongs to features — the pages the reader may open, and the account they act on.
type AppShellProps = {
  navigation: ReactNode;
  languageMenu: ReactNode;
  userMenu: ReactNode;
};

export function AppShell({ navigation, languageMenu, userMenu }: AppShellProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <Link to="/" className="font-heading font-semibold">{t("app_name")}</Link>

        <nav aria-label={t("navigation.label")} className="
          ml-4 flex items-center gap-4
        "
        >
          {navigation}
        </nav>

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
