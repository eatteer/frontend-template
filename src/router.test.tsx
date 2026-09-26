import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderRoute } from "@test/render";

describe("the application's routes", () => {
  it("renders the home page inside the app shell", async () => {
    renderRoute("/");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Frontend template" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "Theme" })).toBeInTheDocument();
  });

  it("answers an unknown path with the not-found page, which leads back home", async () => {
    const user = userEvent.setup();

    renderRoute("/no-such-page");

    expect(await screen.findByText("Page not found")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Go to the home page" }));

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();
  });
});
