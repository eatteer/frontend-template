import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { LanguageMenu } from "@/common/components/language-menu";

import { renderWithProviders } from "@test/render";

describe("LanguageMenu", () => {
  it("switches the application to the language the reader picks", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LanguageMenu />);

    await user.click(screen.getByRole("button", { name: "Language" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Español" }));

    expect(await screen.findByRole("button", { name: "Idioma" })).toBeInTheDocument();

    expect(document.documentElement.lang).toBe("es");
  });
});
