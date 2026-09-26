import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LanguageMenu } from "@/common/components/language-menu";
import { ThemeMenu } from "@/common/components/theme/theme-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/common/ui/card";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { resolveRedirect } from "@/features/auth/model/redirect";

import type { JSX } from "react";

const signInRoute = getRouteApi("/sign-in");

export function SignInPage(): JSX.Element {
  const { t } = useTranslation("auth");
  const { redirect } = signInRoute.useSearch();
  const navigate = signInRoute.useNavigate();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-end gap-1 px-4">
        <LanguageMenu />
        <ThemeMenu />
      </header>

      <main className="grid flex-1 place-items-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              <h1 className="font-heading text-xl font-semibold">{t("signIn.title")}</h1>
            </CardTitle>

            <CardDescription>{t("signIn.description")}</CardDescription>
          </CardHeader>

          <CardContent>
            <SignInForm
              onSignedIn={() => {
                // Replacing the sign-in page, so Back does not return to a form for a session that exists.
                void navigate({ href: resolveRedirect(redirect), replace: true });
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
