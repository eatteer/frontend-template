import { ApiError } from "@/common/api/api-error";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

// Puts each field error the backend sent on the field it names — the first one focused, so a
// keyboard or screen-reader user lands on it — and says whether every one of them found a field.
// When one did not, or the failure was never an answer from the backend, the caller still has
// something to show the reader beyond the fields.
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const placeable = error.fieldErrors.filter(({ field }: { field: string }): boolean => fields.some((name: Path<T>): boolean => name === field));

  placeable.forEach(({ field, message }: { field: string; message: string }, index: number): void => {
    setError(field as Path<T>, { type: "server", message }, { shouldFocus: index === 0 });
  });

  return placeable.length > 0 && placeable.length === error.fieldErrors.length;
}
