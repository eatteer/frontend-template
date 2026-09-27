import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { SearchXIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FIRST_PAGE } from "@/common/api/pagination";
import { DataTablePagination } from "@/common/components/data-table/data-table-pagination";
import type { Sort } from "@/common/components/data-table/sortable-table-head";
import { ErrorState } from "@/common/components/error-state";
import { buttonVariants } from "@/common/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/common/ui/empty";
import { useHasPermissions } from "@/features/auth/api/use-session";
import { userQueries } from "@/features/users/api/user-queries";
import { UsersFiltersBar } from "@/features/users/components/users-filters";
import type { UsersFilters } from "@/features/users/components/users-filters";
import { UsersTable, UsersTableSkeleton } from "@/features/users/components/users-table";
import { DEFAULT_USER_SORT } from "@/features/users/model/user";
import type { UserSortBy } from "@/features/users/model/user";
import type { UsersSearch } from "@/features/users/schemas/users-search.schema";

import type { JSX } from "react";

const usersRoute = getRouteApi("/_app/users/");

type UsersListContentProps = {
  search: UsersSearch;
  sort: Sort<UserSortBy>;
  onSort: (sort: Sort<UserSortBy>) => void;
  onPageChange: (page: number) => void;
};

// One state at a time, resolved top to bottom: loading, failed, nothing to show, the users.
function UsersListContent({ search, sort, onSort, onPageChange }: UsersListContentProps): JSX.Element {
  const { t } = useTranslation("users");

  const users = useQuery(userQueries.list(search));

  if (users.isPending) {
    return <UsersTableSkeleton />;
  }

  if (users.isError) {
    return (
      <ErrorState
        error={users.error}
        onRetry={() => {
          void users.refetch();
        }}
      />
    );
  }

  if (users.data.items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon aria-hidden="true" />
          </EmptyMedia>

          <EmptyTitle>{t("list.empty.title")}</EmptyTitle>
          <EmptyDescription>{t("list.empty.detail")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <UsersTable users={users.data.items} sort={sort} onSort={onSort} isBusy={users.isPlaceholderData} />
      <DataTablePagination pagination={users.data.pagination} onPageChange={onPageChange} />
    </div>
  );
}

export function UsersListPage(): JSX.Element {
  const { t } = useTranslation("users");

  const search = usersRoute.useSearch();
  const navigate = usersRoute.useNavigate();

  const canCreateUsers = useHasPermissions(["users:create"]);

  const sort: Sort<UserSortBy> = {
    sortBy: search.sortBy ?? DEFAULT_USER_SORT.sortBy,
    sortOrder: search.sortOrder ?? DEFAULT_USER_SORT.sortOrder,
  };

  // Anything but the page itself starts again from the first page: page 3 of the old results says
  // nothing about the new ones.
  function changeList(change: Partial<UsersSearch>): void {
    void navigate({ search: (previous: UsersSearch): UsersSearch => ({ ...previous, ...change, page: undefined }) });
  }

  function changePage(page: number): void {
    void navigate({
      search: (previous: UsersSearch): UsersSearch => ({ ...previous, page: page === FIRST_PAGE ? undefined : page }),
    });
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">{t("list.title")}</h1>
          <p className="text-muted-foreground">{t("list.description")}</p>
        </div>

        {canCreateUsers && (
          <Link to="/users/new" className={buttonVariants()}>{t("list.create")}</Link>
        )}
      </header>

      <UsersFiltersBar
        search={search.search}
        status={search.status}
        onChange={(change: Partial<UsersFilters>) => {
          changeList(change);
        }}
      />

      <UsersListContent search={search} sort={sort} onSort={changeList} onPageChange={changePage} />
    </section>
  );
}
