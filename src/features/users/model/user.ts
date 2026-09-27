import type { SortOrder } from "@/common/api/pagination";
import { pathsApiV1UsersGetParametersQuerySortByValues, pathsApiV1UsersGetParametersQueryStatusValues } from "@/common/api/schema.gen";
import type { UserDTO } from "@/common/api/schema.gen";
import type { Sort } from "@/common/components/data-table/sortable-table-head";
import type { Language } from "@/common/i18n/languages";

// Both catalogs are the backend's, generated from its OpenAPI: a status or sort field it adds or
// drops changes the filters and the columns at compile time.
export const USER_STATUS_VALUES = pathsApiV1UsersGetParametersQueryStatusValues;

export type UserStatus = UserDTO["status"];

export const USER_SORT_BY_VALUES = pathsApiV1UsersGetParametersQuerySortByValues;

export type UserSortBy = (typeof USER_SORT_BY_VALUES)[number];

// The order the backend lists users in when none is asked for: newest first.
export const DEFAULT_USER_SORT: Sort<UserSortBy> = { sortBy: "createdAt", sortOrder: "desc" satisfies SortOrder };

export type User = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  preferredLanguage: Language;
  // ISO 8601 in UTC, as the formatters take them.
  createdAt: string;
  updatedAt: string;
};
