import { FIRST_PAGE } from "@/common/api/pagination";
import type { ApiPagination } from "@/common/api/schema.gen";

export type PageDto<T> = {
  data: T[];
  pagination: ApiPagination;
};

// The page size the backend answers with when a request names none.
export const DEFAULT_PAGE_LIMIT = 10;

// A paginated answer holding `items` as its only page, unless the overrides say which page it is.
export function buildPageDto<T>(items: T[] = [], overrides: Partial<ApiPagination> = {}): PageDto<T> {
  return {
    data: items,
    pagination: {
      total: items.length,
      pages: items.length === 0 ? 0 : 1,
      page: FIRST_PAGE,
      limit: DEFAULT_PAGE_LIMIT,
      next: null,
      previous: null,
      ...overrides,
    },
  };
}
