import { MISSING_DATA_MESSAGE } from "@/common/api/envelope";
import type { APIPagination } from "@/common/api/schema.gen";

export type Pagination = APIPagination;

export type Paginated<T> = {
  items: T[];
  pagination: Pagination;
};

export function unwrapPage<T>({ data }: { data?: { data: T[]; pagination: Pagination } }): Paginated<T> {
  if (data === undefined) {
    throw new Error(MISSING_DATA_MESSAGE);
  }

  return { items: data.data, pagination: data.pagination };
}

export function mapPage<T, U>(page: Paginated<T>, map: (item: T) => U): Paginated<U> {
  return { items: page.items.map(map), pagination: page.pagination };
}
