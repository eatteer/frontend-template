import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { sessionQuery } from "@/features/auth/api/session-queries";
import { resolveRedirect } from "@/features/auth/model/redirect";
import { SignInPage } from "@/features/auth/pages/sign-in-page";

const signInSearchSchema = z.object({
  // Where the reader was going when they were sent here.
  redirect: z.string().optional(),
});

// Outside the signed-in layout. Someone already signed in has nothing to do here and goes on to
// where they were headed.
export const Route = createFileRoute("/sign-in")({
  validateSearch: signInSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);

    if (session !== null) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- the router's control flow: a thrown redirect is how `beforeLoad` navigates.
      throw redirect({ href: resolveRedirect(search.redirect), replace: true });
    }
  },
  component: SignInPage,
});
