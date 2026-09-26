import { z } from "zod";

import type { ProblemDetailsDTO } from "@/common/api/schema.gen";

export const PROBLEM_DETAILS_MEDIA_TYPE = "application/problem+json";

// Checked against the generated type, so a change to the backend's error body fails the build here
// instead of at the first error a user sees.
const problemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string(),
  instance: z.string(),
  code: z.string(),
  traceId: z.string(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })),
}) satisfies z.ZodType<ProblemDetailsDTO>;

export function parseProblemDetails(body: unknown): ProblemDetailsDTO | undefined {
  const result = problemDetailsSchema.safeParse(body);

  return result.success ? result.data : undefined;
}
