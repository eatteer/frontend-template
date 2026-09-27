import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/common/ui/card";
import { userQueries } from "@/features/users/api/user-queries";
import { EditUserForm, EditUserFormSkeleton } from "@/features/users/components/edit-user-form";

import type { JSX, ReactNode } from "react";

const editUserRoute = getRouteApi("/_app/users/$id/edit");

function EditUserLayout({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation("users");

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="font-heading text-xl font-semibold">{t("edit.title")}</h1>
          </CardTitle>

          <CardDescription>{t("edit.description")}</CardDescription>
        </CardHeader>

        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

export function EditUserPage(): JSX.Element {
  const { id } = editUserRoute.useParams();
  const navigate = editUserRoute.useNavigate();

  const { data: user } = useSuspenseQuery(userQueries.detail(id));

  return (
    <EditUserLayout>
      <EditUserForm
        user={user}
        onSaved={() => {
          void navigate({ to: "/users/$id", params: { id }, replace: true });
        }}
      />
    </EditUserLayout>
  );
}

export function EditUserPageSkeleton(): JSX.Element {
  return (
    <EditUserLayout>
      <EditUserFormSkeleton />
    </EditUserLayout>
  );
}
