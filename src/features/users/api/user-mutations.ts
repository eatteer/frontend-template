import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { APIError } from "@/common/api/api-error";
import { apiClient } from "@/common/api/client";
import { unwrap } from "@/common/api/envelope";
import { publishSessionEvent } from "@/common/api/session-events";
import { sessionQuery } from "@/features/auth/api/session-queries";
import { userQueries } from "@/features/users/api/user-queries";
import type { CreateUserValues } from "@/features/users/schemas/create-user.schema";
import type { EditUserValues } from "@/features/users/schemas/edit-user.schema";

import type { UseMutationResult } from "@tanstack/react-query";

async function createUser(values: CreateUserValues): Promise<string> {
  return unwrap(await apiClient.POST("/api/v1/users", { body: values })).id;
}

async function updateUser(id: string, values: EditUserValues): Promise<void> {
  await apiClient.PATCH("/api/v1/users/{id}", { params: { path: { id } }, body: values });
}

// Resolves to the new user's id. Both forms show their own failures — on the fields when the
// backend names them, in a toast when it does not — so the default toast is off.
export function useCreateUser(): UseMutationResult<string, APIError, CreateUserValues> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    meta: { errorToast: false },
    // Returned, so the mutation settles — and the loader lifts — only once every list knows it is
    // out of date: whichever the reader goes back to asks the backend again.
    onSuccess: (): Promise<void> => queryClient.invalidateQueries({ queryKey: userQueries.lists() }),
  });
}

export function useUpdateUser(id: string): UseMutationResult<void, APIError, EditUserValues> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: EditUserValues): Promise<void> => updateUser(id, values),
    meta: { errorToast: false },
    onSuccess: async (): Promise<void> => {
      // An administrator editing their own account changes what the account menu shows, in this tab
      // and in every other one.
      const isOwnAccount = queryClient.getQueryData(sessionQuery.queryKey)?.user.id === id;

      if (isOwnAccount) {
        publishSessionEvent({ type: "updated" });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userQueries.all() }),
        isOwnAccount ? queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey }) : undefined,
      ]);
    },
  });
}
