import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { SearchXIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FIRST_PAGE } from "@/common/api/pagination";
import { DataTablePagination, DataTablePaginationSkeleton } from "@/common/components/data-table/data-table-pagination";
import type { Sort } from "@/common/components/data-table/sortable-table-head";
import { ErrorState } from "@/common/components/error-state";
import { buttonVariants } from "@/common/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/common/ui/empty";
import { useHasPermissions } from "@/features/auth/api/use-session";
import { userQueries } from "@/features/users/api/user-queries";
import { UsersFilters } from "@/features/users/components/users-filters";
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
    return (
      <div className="flex flex-col gap-4">
        <UsersTableSkeleton />
        <DataTablePaginationSkeleton />
      </div>
    );
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
    const isFiltered = search.search !== undefined || search.status !== undefined;

    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon aria-hidden="true" />
          </EmptyMedia>

          <EmptyTitle>{t("list.empty.title")}</EmptyTitle>
          <EmptyDescription>{t(isFiltered ? "list.empty.no_matches" : "list.empty.no_users")}</EmptyDescription>
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
  function changeList(change: Partial<UsersSearch>, replace = false): void {
    void navigate({ search: (previous: UsersSearch): UsersSearch => ({ ...previous, ...change, page: undefined }), replace });
  }

  // Starting a search is a step Back returns from; refining or clearing it only corrects that step,
  // so a pause at every few keys does not pile up in the history.
  function changeFilters(change: Partial<UsersSearch>): void {
    changeList(change, "search" in change && search.search !== undefined);
  }

  // The backend's default order is the absence of one: spelled out, it would sit in the URL and the
  // request for nothing, and a link to the plain list would stop matching it.
  function changeSort(next: Sort<UserSortBy>): void {
    const isDefault = next.sortBy === DEFAULT_USER_SORT.sortBy && next.sortOrder === DEFAULT_USER_SORT.sortOrder;

    changeList(isDefault ? { sortBy: undefined, sortOrder: undefined } : next);
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

      <UsersFilters
        search={search.search}
        status={search.status}
        onChange={changeFilters}
      />

      {/* A full page of rows, reserved for every state, so switching between them never moves the page. */}
      <div className="min-h-120">
        <UsersListContent search={search} sort={sort} onSort={changeSort} onPageChange={changePage} />
      </div>
    </section>
  );
}
