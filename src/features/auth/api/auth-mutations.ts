import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/common/api/api-error";
import { apiClient } from "@/common/api/client";
import { publishSessionEvent } from "@/common/api/session-events";
import { sessionQuery } from "@/features/auth/api/session-queries";
import type { SignInValues } from "@/features/auth/schemas/sign-in.schema";

import type { UseMutationResult } from "@tanstack/react-query";

// The cookie transport is the backend's default: the tokens arrive as HttpOnly cookies, out of reach
// of any script on the page, and the body carries nothing worth keeping.
async function signIn(credentials: SignInValues): Promise<void> {
  await apiClient.POST("/api/v1/auth/login", { body: credentials });
}

async function signOut(): Promise<void> {
  await apiClient.POST("/api/v1/auth/logout", { body: {} });
}

export function useSignIn(): UseMutationResult<void, ApiError, SignInValues> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signIn,
    // The form shows what went wrong beside what caused it.
    meta: { errorToast: false },
    // Awaited, so the mutation settles only once the session is in the cache, and the page the
    // reader goes to next finds it there.
    onSuccess: async (): Promise<void> => {
      await queryClient.fetchQuery({ ...sessionQuery, staleTime: 0 });

      publishSessionEvent({ type: "signed-in" });
    },
  });
}

// Leaving the page and emptying the cache happen in one place for every way a session ends — see
// SessionSync.
export function useSignOut(): UseMutationResult<void, ApiError, void> {
  return useMutation({
    mutationFn: signOut,
    onSuccess: (): void => {
      publishSessionEvent({ type: "signed-out", reason: "sign-out" });
    },
  });
}
