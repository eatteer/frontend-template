import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ERROR_TOAST_TIMEOUT_MS, showErrorToast } from "@/common/components/error-toast";
import { changeLanguage } from "@/common/i18n/i18n";
import { toast } from "@/common/ui/toast";

import { buildApiError } from "@test/builders/api-error.builder";
import { renderWithProviders } from "@test/render";

// A high-priority toast is announced from an alert region, and the toast on screen stays hidden from
// assistive technology until it takes focus, so its buttons are queried with `hidden`.
describe("showErrorToast", () => {
  it("announces what went wrong without any id", async () => {
    renderWithProviders(null);

    const error = buildApiError();

    showErrorToast(error);

    const alert = await screen.findByRole("alert");

    expect(within(alert).getByText("Conflict")).toBeInTheDocument();
    expect(within(alert).getByText("The email is already registered")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(error.traceId ?? "");
  });

  it("closes on its own and is announced right away", () => {
    const add = vi.spyOn(toast, "add");

    showErrorToast(buildApiError());

    expect(add).toHaveBeenCalledWith(expect.objectContaining({ timeout: ERROR_TOAST_TIMEOUT_MS, priority: "high" }));

    add.mockRestore();
  });

  it("copies the whole report and says so", async () => {
    const user = userEvent.setup();
    const error = buildApiError({ fieldErrors: [{ field: "email", message: "Invalid email" }] });

    renderWithProviders(null);
    showErrorToast(error);

    await user.click(await screen.findByRole("button", { name: "Copy error", hidden: true }));

    expect(JSON.parse(await navigator.clipboard.readText())).toEqual(error.toReport());
    expect(await screen.findByRole("button", { name: "Copied", hidden: true })).toBeDisabled();
  });

  it("keeps offering to copy when the browser refuses the clipboard", async () => {
    const user = userEvent.setup();

    renderWithProviders(null);
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("Denied"));
    showErrorToast(buildApiError());

    await user.click(await screen.findByRole("button", { name: "Copy error", hidden: true }));

    expect(screen.getByRole("button", { name: "Copy error", hidden: true })).toBeEnabled();
  });

  // Hidden from the accessibility tree until focused, the button has no computed name to query by.
  it("names its close button in the reader's language", async () => {
    await changeLanguage("es");
    renderWithProviders(null);
    showErrorToast(buildApiError());

    await screen.findByRole("alert");

    expect(document.querySelector("[data-slot=toast-close]")).toHaveAttribute("aria-label", "Cerrar");
  });
});
