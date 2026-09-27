import { act, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { THEME_STORAGE_KEY } from "@/common/components/theme/theme";
import { ThemeMenu } from "@/common/components/theme/theme-menu";

import { stubMatchMedia } from "@test/match-media";
import { renderWithProviders } from "@test/render";

describe("ThemeMenu", () => {
  it("applies and remembers the theme the reader picks", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ThemeMenu />);

    await user.click(screen.getByRole("button", { name: "Theme" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Dark" }));

    expect(document.documentElement).toHaveClass("dark");

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("follows the system while the reader has not picked a theme", () => {
    const system = stubMatchMedia({ prefersDark: false });

    renderWithProviders(<ThemeMenu />);

    expect(document.documentElement).toHaveClass("light");

    act(() => {
      system.setPrefersDark(true);
    });

    expect(document.documentElement).toHaveClass("dark");
  });

  it("marks the theme in use", async () => {
    const user = userEvent.setup();

    localStorage.setItem(THEME_STORAGE_KEY, "light");

    renderWithProviders(<ThemeMenu />);

    await user.click(screen.getByRole("button", { name: "Theme" }));

    expect(await screen.findByRole("menuitemradio", { name: "Light" })).toBeChecked();
    expect(screen.getByRole("menuitemradio", { name: "System" })).not.toBeChecked();
  });
});
