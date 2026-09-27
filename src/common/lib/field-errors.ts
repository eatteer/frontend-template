import { ApiError } from "@/common/api/api-error";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

function isFieldOf<T extends FieldValues>(field: string, fields: readonly Path<T>[]): field is Path<T> {
  return (fields as readonly string[]).includes(field);
}

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

  let placed = 0;

  for (const { field, message } of error.fieldErrors) {
    if (isFieldOf(field, fields)) {
      setError(field, { type: "server", message }, { shouldFocus: placed === 0 });

      placed += 1;
    }
  }

  return placed > 0 && placed === error.fieldErrors.length;
}
