import { useTranslation } from "react-i18next";

import { useFormatters } from "@/common/hooks/use-formatters";
import { LANGUAGE_LABELS } from "@/common/i18n/languages";
import { Skeleton } from "@/common/ui/skeleton";
import { UserStatusBadge } from "@/features/users/components/user-status-badge";
import type { User } from "@/features/users/model/user";

import type { JSX, ReactNode } from "react";

const DETAIL_ROWS = 5;

function DetailRow({ label, children }: { label: ReactNode; children: ReactNode }): JSX.Element {
  return (
    <div className="
      grid gap-1 border-b py-3
      last:border-b-0
      sm:grid-cols-3
    "
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>

      <dd className="
        text-sm
        sm:col-span-2
      "
      >
        {children}
      </dd>
    </div>
  );
}

export function UserDetails({ user }: { user: User }): JSX.Element {
  const { t } = useTranslation("users");

  const format = useFormatters();

  return (
    <dl>
      <DetailRow label={t("detail.email")}>{user.email}</DetailRow>
      <DetailRow label={t("detail.status")}><UserStatusBadge status={user.status} /></DetailRow>
      <DetailRow label={t("detail.language")}>{LANGUAGE_LABELS[user.preferredLanguage]}</DetailRow>
      <DetailRow label={t("detail.created_at")}>{format.dateTime(user.createdAt)}</DetailRow>
      <DetailRow label={t("detail.updated_at")}>{format.dateTime(user.updatedAt)}</DetailRow>
    </dl>
  );
}

// The same rows, built from the same row, with the values still to come.
export function UserDetailsSkeleton(): JSX.Element {
  return (
    <dl aria-busy="true">
      {Array.from({ length: DETAIL_ROWS }, (_: unknown, row: number): JSX.Element => (
        <DetailRow key={row} label={<Skeleton className="h-5 w-24" />}>
          <Skeleton className="h-5 w-48" />
        </DetailRow>
      ))}
    </dl>
  );
}
