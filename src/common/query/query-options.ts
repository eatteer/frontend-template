import type { ApiError } from "@/common/api/api-error";

import type { DataTag, QueryKey, UnusedSkipTokenOptions } from "@tanstack/react-query";

// What `queryOptions()` returns for a query that always has a `queryFn`, spelled out once so a
// factory of them can declare its return type: the key carries the data type, so every
// `getQueryData`, `setQueryData` and `useQuery` over it is typed without a cast.
export type AppQueryOptions<TData, TKey extends QueryKey> = UnusedSkipTokenOptions<TData, ApiError, TData, TKey> & {
  queryKey: DataTag<TKey, TData, ApiError>;
};
