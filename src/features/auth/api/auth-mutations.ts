import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/common/api/api-error";
import { apiClient } from "@/common/api/client";
import { publishSessionEvent } from "@/common/api/session-events";
import { changeLanguage } from "@/common/i18n/i18n";
import type { Language } from "@/common/i18n/languages";
import { ALWAYS_STALE_MS } from "@/common/query/query-client";
import { sessionQuery } from "@/features/auth/api/session-queries";
import type { Session } from "@/features/auth/model/session";
import type { SignInValues } from "@/features/auth/schemas/sign-in.schema";

import type { QueryClient, UseMutationResult } from "@tanstack/react-query";

// The account's language before the switch, to put back if the backend refuses it.
type LanguageRollback = { previous: Language | undefined };

// The cookie transport is the backend's default: the tokens arrive as HttpOnly cookies, out of reach
// of any script on the page, and the body carries nothing worth keeping.
async function signIn(credentials: SignInValues): Promise<void> {
  await apiClient.POST("/api/v1/auth/login", { body: credentials });
}

async function signOut(): Promise<void> {
  await apiClient.POST("/api/v1/auth/logout", { body: {} });
}

async function updateAccountLanguage(preferredLanguage: Language): Promise<void> {
  await apiClient.PATCH("/api/v1/users/me/preferences", { body: { preferredLanguage } });
}

function setSessionLanguage(queryClient: QueryClient, preferredLanguage: Language): void {
  queryClient.setQueryData(
    sessionQuery.queryKey,
    (session: Session | null | undefined): Session | null | undefined => session
      ? { ...session, user: { ...session.user, preferredLanguage } }
      : session,
  );
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
      await queryClient.fetchQuery({ ...sessionQuery, staleTime: ALWAYS_STALE_MS });

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

// The screen switches at once and the backend is told after; a refusal switches it back, with the
// toast saying why. Other tabs read the session again once the change is stored.
export function useChangeAccountLanguage(): UseMutationResult<void, ApiError, Language, LanguageRollback> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccountLanguage,
    // Nothing on screen waits for it: the new language is already showing.
    meta: { fullscreenLoader: false },
    onMutate: async (language: Language): Promise<LanguageRollback> => {
      const previous = queryClient.getQueryData(sessionQuery.queryKey)?.user.preferredLanguage;

      setSessionLanguage(queryClient, language);

      await changeLanguage(language);

      return { previous };
    },
    onError: async (_error: ApiError, _language: Language, rollback: LanguageRollback | undefined): Promise<void> => {
      if (rollback?.previous === undefined) {
        return;
      }

      setSessionLanguage(queryClient, rollback.previous);

      await changeLanguage(rollback.previous);
    },
    onSuccess: (): void => {
      publishSessionEvent({ type: "updated" });
    },
  });
}
