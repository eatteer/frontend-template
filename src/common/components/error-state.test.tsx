import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "@/common/components/error-state";

import { buildApiError } from "@test/builders/api-error.builder";
import { renderWithProviders } from "@test/render";

describe("ErrorState", () => {
  it("explains the failure in the server's words", () => {
    renderWithProviders(<ErrorState error={buildApiError()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Conflict");
    expect(screen.getByRole("alert")).toHaveTextContent("The email is already registered");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("offers a retry when the screen can retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(<ErrorState error={new Error("boom")} onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("copies the same report as the toast", async () => {
    const user = userEvent.setup();
    const error = buildApiError();

    renderWithProviders(<ErrorState error={error} />);

    await user.click(screen.getByRole("button", { name: "Copy error" }));

    expect(JSON.parse(await navigator.clipboard.readText())).toEqual(error.toReport());
    expect(screen.getByRole("button", { name: "Copied" })).toBeDisabled();
  });

  it("keeps offering to copy when the browser refuses the clipboard", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ErrorState error={buildApiError()} />);
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("Denied"));

    await user.click(screen.getByRole("button", { name: "Copy error" }));

    expect(screen.getByRole("button", { name: "Copy error" })).toBeEnabled();
  });
});
