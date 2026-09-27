import { z } from "zod";

// Where the reader was going when they were sent to sign in. A value that does not parse (an edited
// URL) is dropped, and the reader lands on the home page instead of an error.
export const signInSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export type SignInSearch = z.output<typeof signInSearchSchema>;
