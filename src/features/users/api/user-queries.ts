import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/common/api/client";
import { unwrap } from "@/common/api/envelope";
import { mapPage, unwrapPage } from "@/common/api/pagination";
import type { Paginated } from "@/common/api/pagination";
import type { AppQueryOptions } from "@/common/query/query-options";
import { toUser } from "@/features/users/api/user.mapper";
import type { User } from "@/features/users/model/user";
import type { UsersSearch } from "@/features/users/schemas/users-search.schema";

// The backend's default page size, stated so the page a reader sees does not change if it does.
export const USERS_PAGE_SIZE = 10;

async function fetchUsers(search: UsersSearch, signal: AbortSignal): Promise<Paginated<User>> {
  const page = unwrapPage(await apiClient.GET("/api/v1/users", {
    params: { query: { ...search, limit: USERS_PAGE_SIZE } },
    signal,
  }));

  return mapPage(page, toUser);
}

async function fetchUser(id: string, signal: AbortSignal): Promise<User> {
  return toUser(unwrap(await apiClient.GET("/api/v1/users/{id}", { params: { path: { id } }, signal })));
}

type UsersKey = readonly ["users"];
type UserListsKey = readonly ["users", "list"];
type UserListKey = readonly ["users", "list", UsersSearch];
type UserDetailKey = readonly ["users", "detail", string];

// Keys nest from the feature down, so a change invalidates exactly what it touched: every list
// after a create, everything about the users after an edit.
export const userQueries = {
  all: (): UsersKey => ["users"],
  lists: (): UserListsKey => [...userQueries.all(), "list"],
  list: (search: UsersSearch): AppQueryOptions<Paginated<User>, UserListKey> => queryOptions({
    queryKey: [...userQueries.lists(), search] as const,
    queryFn: ({ signal }: { signal: AbortSignal }): Promise<Paginated<User>> => fetchUsers(search, signal),
    // The page on screen stays while the next one loads, so paging and filtering do not flash a
    // skeleton; the table marks itself busy meanwhile.
    placeholderData: keepPreviousData,
  }),
  detail: (id: string): AppQueryOptions<User, UserDetailKey> => queryOptions({
    queryKey: [...userQueries.all(), "detail", id] as const,
    queryFn: ({ signal }: { signal: AbortSignal }): Promise<User> => fetchUser(id, signal),
  }),
};
