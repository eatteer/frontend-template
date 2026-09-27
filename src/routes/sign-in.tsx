import { createFileRoute, redirect } from "@tanstack/react-router";

import { sessionQuery } from "@/features/auth/api/session-queries";
import { resolveRedirect } from "@/features/auth/model/redirect";
import { SignInPage } from "@/features/auth/pages/sign-in-page";
import { signInSearchSchema } from "@/features/auth/schemas/sign-in-search.schema";
import type { SignInSearch } from "@/features/auth/schemas/sign-in-search.schema";
import type { RouterContext } from "@/router";

// Outside the signed-in layout. Someone already signed in has nothing to do here and goes on to
// where they were headed.
export const Route = createFileRoute("/sign-in")({
  validateSearch: signInSearchSchema,
  beforeLoad: async ({ context, search }: { context: RouterContext; search: SignInSearch }): Promise<void> => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);

    if (session !== null) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- the router's control flow: a thrown redirect is how `beforeLoad` navigates.
      throw redirect({ href: resolveRedirect(search.redirect), replace: true });
    }
  },
  component: SignInPage,
});
