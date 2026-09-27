import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { buttonVariants } from "@/common/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/common/ui/card";
import { CreateUserForm } from "@/features/users/components/create-user-form";

import type { JSX } from "react";

export function CreateUserPage(): JSX.Element {
  const { t } = useTranslation("users");

  const navigate = useNavigate();

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-4">
      <Link to="/users" className={buttonVariants({ variant: "ghost", className: "self-start" })}>
        <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
        {t("detail.back")}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="font-heading text-xl font-semibold">{t("create.title")}</h1>
          </CardTitle>

          <CardDescription>{t("create.description")}</CardDescription>
        </CardHeader>

        <CardContent>
          <CreateUserForm
            onCreated={(id) => {
              // Replacing the form, so Back does not return to it for a user that now exists.
              void navigate({ to: "/users/$id", params: { id }, replace: true });
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
