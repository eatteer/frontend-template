import { z } from "zod";

import { FIRST_PAGE, SORT_ORDER_VALUES } from "@/common/api/pagination";
import { USER_SORT_BY_VALUES, USER_STATUS_VALUES } from "@/features/users/model/user";

// The backend's limit on the term: past it, the request is refused.
export const USER_SEARCH_MAX_LENGTH = 120;

// The list's state, as the URL carries it. Absent is the backend's default, never a sentinel, and
// only parameters the backend declares are here — it refuses any other. A value that does not parse
// (an edited URL, an old bookmark) is dropped rather than failing the page.
export const usersSearchSchema = z.object({
  page: z.int().min(FIRST_PAGE).optional().catch(undefined),
  search: z.string().trim().min(1).max(USER_SEARCH_MAX_LENGTH).optional().catch(undefined),
  status: z.enum(USER_STATUS_VALUES).optional().catch(undefined),
  sortBy: z.enum(USER_SORT_BY_VALUES).optional().catch(undefined),
  sortOrder: z.enum(SORT_ORDER_VALUES).optional().catch(undefined),
});

export type UsersSearch = z.output<typeof usersSearchSchema>;
