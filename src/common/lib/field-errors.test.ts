import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { applyFieldErrors } from "@/common/lib/field-errors";

import { buildApiError } from "@test/builders/api-error.builder";

type Values = { email: string; name: string };

const FIELDS = ["email", "name"] as const;

function renderForm(): { current: ReturnType<typeof useForm<Values>> } {
  return renderHook(() => useForm<Values>({ defaultValues: { email: "", name: "" } })).result;
}

describe("applyFieldErrors", () => {
  it("puts every error on its field and says all of them found one", () => {
    const form = renderForm();
    const error = buildApiError({ status: 400, fieldErrors: [{ field: "email", message: "Taken" }, { field: "name", message: "Too long" }] });
    let isPlaced = false;

    act(() => {
      isPlaced = applyFieldErrors(error, form.current.setError, FIELDS);
    });

    expect(isPlaced).toBe(true);
    expect(form.current.getFieldState("email").error?.message).toBe("Taken");
    expect(form.current.getFieldState("name").error?.message).toBe("Too long");
  });

  it("says so when an error names a field this form does not have", () => {
    const form = renderForm();
    const error = buildApiError({ status: 400, fieldErrors: [{ field: "email", message: "Taken" }, { field: "items.0.sku", message: "Unknown" }] });
    let isPlaced = true;

    act(() => {
      isPlaced = applyFieldErrors(error, form.current.setError, FIELDS);
    });

    expect(isPlaced).toBe(false);
    expect(form.current.getFieldState("email").error?.message).toBe("Taken");
  });

  it("places nothing for an error without fields, or one that is not from the backend", () => {
    const form = renderForm();

    expect(applyFieldErrors(buildApiError(), form.current.setError, FIELDS)).toBe(false);
    expect(applyFieldErrors(new Error("cancelled"), form.current.setError, FIELDS)).toBe(false);
  });
});
