import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SortableTableHead } from "@/common/components/data-table/sortable-table-head";
import type { Sort } from "@/common/components/data-table/sortable-table-head";
import { useFormatters } from "@/common/lib/format";
import { Skeleton } from "@/common/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { USERS_PAGE_SIZE } from "@/features/users/api/user-queries";
import { UserStatusBadge } from "@/features/users/components/user-status-badge";
import type { User, UserSortBy } from "@/features/users/model/user";

import type { JSX } from "react";

type UsersTableProps = {
  users: User[];
  sort: Sort<UserSortBy>;
  onSort: (sort: Sort<UserSortBy>) => void;
  // The next page or filter is loading behind the rows on screen.
  isBusy: boolean;
};

export function UsersTable({ users, sort, onSort, isBusy }: UsersTableProps): JSX.Element {
  const { t } = useTranslation("users");

  const format = useFormatters();

  return (
    <Table aria-busy={isBusy} className={isBusy ? "opacity-60" : undefined}>
      <TableCaption className="sr-only">{t("list.caption")}</TableCaption>

      <TableHeader>
        <TableRow>
          <SortableTableHead field="name" label={t("list.columns.name")} sort={sort} onSort={onSort} />
          <SortableTableHead field="email" label={t("list.columns.email")} sort={sort} onSort={onSort} />
          <TableHead>{t("list.columns.status")}</TableHead>
          <SortableTableHead field="createdAt" label={t("list.columns.created_at")} sort={sort} onSort={onSort} />
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.map((user: User): JSX.Element => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <Link
                to="/users/$id"
                params={{ id: user.id }}
                className="
                  underline-offset-4
                  hover:underline
                "
              >
                {user.name}
              </Link>
            </TableCell>

            <TableCell>{user.email}</TableCell>
            <TableCell><UserStatusBadge status={user.status} /></TableCell>
            <TableCell>{format.date(user.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// The table as it will look, a full page of rows, so nothing below it moves when the users arrive.
export function UsersTableSkeleton(): JSX.Element {
  const { t } = useTranslation("users");

  return (
    <Table aria-busy="true">
      <TableCaption className="sr-only">{t("list.caption")}</TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>{t("list.columns.name")}</TableHead>
          <TableHead>{t("list.columns.email")}</TableHead>
          <TableHead>{t("list.columns.status")}</TableHead>
          <TableHead>{t("list.columns.created_at")}</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {Array.from({ length: USERS_PAGE_SIZE }, (_: unknown, row: number): JSX.Element => (
          <TableRow key={row}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16 rounded-4xl" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
