import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/common/components/app-shell";
import { requireSession } from "@/features/auth/api/session-guards";
import { AccountLanguageMenu } from "@/features/auth/components/account-language-menu";
import { UserMenu } from "@/features/auth/components/user-menu";

import type { JSX } from "react";

// Everything under this layout needs a session; its routes read it from their context.
export const Route = createFileRoute("/_app")({
  beforeLoad: requireSession,
  component: (): JSX.Element => <AppShell languageMenu={<AccountLanguageMenu />} userMenu={<UserMenu />} />,
});
