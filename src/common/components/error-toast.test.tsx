import { act, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_TOAST_TIMEOUT_MS, showErrorToast } from "@/common/components/error-toast";
import { changeLanguage } from "@/common/i18n/i18n";

import { buildApiError } from "@test/builders/api-error.builder";
import { renderWithProviders } from "@test/render";

const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";

// A high-priority toast is announced from an alert region, and the toast on screen stays hidden from
// assistive technology until it takes focus, so its buttons are queried with `hidden`.
describe("showErrorToast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces what went wrong without any id", async () => {
    renderWithProviders(null);
    showErrorToast(buildApiError({ traceId: TRACE_ID }));

    const alert = await screen.findByRole("alert");

    expect(within(alert).getByText("Conflict")).toBeInTheDocument();
    expect(within(alert).getByText("The email is already registered")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(TRACE_ID);
  });

  it("is announced right away, and closes on its own", () => {
    vi.useFakeTimers();

    renderWithProviders(null);

    act(() => {
      showErrorToast(buildApiError());
    });

    expect(screen.getByRole("alert")).toHaveTextContent("The email is already registered");

    act(() => {
      vi.advanceTimersByTime(ERROR_TOAST_TIMEOUT_MS - 1);
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("copies the whole report and says so", async () => {
    const user = userEvent.setup();
    const error = buildApiError({ fieldErrors: [{ field: "email", message: "Invalid email" }] });

    renderWithProviders(null);
    showErrorToast(error);

    await user.click(await screen.findByRole("button", { name: "Copy error", hidden: true }));

    expect(JSON.parse(await navigator.clipboard.readText())).toEqual(error.toReport());
    expect(await screen.findByRole("button", { name: "Copied", hidden: true })).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps offering to copy when the browser refuses the clipboard", async () => {
    const user = userEvent.setup();

    renderWithProviders(null);

    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("Denied"));

    showErrorToast(buildApiError());

    await user.click(await screen.findByRole("button", { name: "Copy error", hidden: true }));

    expect(screen.getByRole("button", { name: "Copy error", hidden: true })).not.toHaveAttribute("aria-disabled", "true");
  });

  // Base UI sets `aria-hidden` on the close button itself until the toast takes focus, and an element
  // hidden that way has no accessible name to query by, even among hidden elements.
  it("names its close button in the reader's language", async () => {
    await changeLanguage("es");

    renderWithProviders(null);
    showErrorToast(buildApiError());

    await screen.findByRole("alert");

    expect(document.querySelector("[data-slot=toast-close]")).toHaveAttribute("aria-label", "Cerrar");
  });
});
