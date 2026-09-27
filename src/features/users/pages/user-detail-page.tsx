import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { ChevronLeftIcon, PencilIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { buttonVariants } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { Skeleton } from "@/common/ui/skeleton";
import { useHasPermissions } from "@/features/auth/api/use-session";
import { userQueries } from "@/features/users/api/user-queries";
import { UserDetails, UserDetailsSkeleton } from "@/features/users/components/user-details";

import type { JSX, ReactNode } from "react";

const userRoute = getRouteApi("/_app/users/$id/");

function BackToUsers(): JSX.Element {
  const { t } = useTranslation("users");

  return (
    <Link to="/users" className={buttonVariants({ variant: "ghost", className: "self-start" })}>
      <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
      {t("detail.back")}
    </Link>
  );
}

function UserDetailLayout({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }): JSX.Element {
  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4">
      <BackToUsers />

      <header className="
        flex min-h-9 flex-wrap items-center justify-between gap-4
      "
      >
        {title}
        {action}
      </header>

      <Card>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

export function UserDetailPage(): JSX.Element {
  const { t } = useTranslation("users");

  const { id } = userRoute.useParams();

  const { data: user } = useSuspenseQuery(userQueries.detail(id));

  const canUpdateUsers = useHasPermissions(["users:update"]);

  return (
    <UserDetailLayout
      title={<h1 className="font-heading text-2xl font-semibold">{user.name}</h1>}
      action={canUpdateUsers && (
        <Link to="/users/$id/edit" params={{ id }} className={buttonVariants({ variant: "outline" })}>
          <PencilIcon aria-hidden="true" data-icon="inline-start" />
          {t("detail.edit")}
        </Link>
      )}
    >
      <UserDetails user={user} />
    </UserDetailLayout>
  );
}

export function UserDetailPageSkeleton(): JSX.Element {
  return (
    <UserDetailLayout title={<Skeleton className="h-8 w-48" />}>
      <UserDetailsSkeleton />
    </UserDetailLayout>
  );
}
