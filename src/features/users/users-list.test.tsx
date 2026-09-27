import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import type { UserDTO } from "@/common/api/schema.gen";

import { buildPageDTO } from "@test/builders/page.builder";
import { buildSessionDTO } from "@test/builders/session.builder";
import { buildUserDTO, buildUserDTOs } from "@test/builders/user.builder";
import { problem } from "@test/msw/api";
import type { MockedResponse } from "@test/msw/api";
import { server } from "@test/msw/server";
import { signedIn } from "@test/msw/session";
import { serveUsers, USERS_URL } from "@test/msw/users";
import type { UsersBackend } from "@test/msw/users";
import { renderRoute } from "@test/render";
import { expectRouteFailureWarning } from "@test/route-failure-warning";

const TWENTY_FIVE_USERS = buildUserDTOs(25);

function lastListQuery(backend: UsersBackend): Record<string, string> {
  return Object.fromEntries(backend.listQueries.at(-1) ?? []);
}

// The rows of the table body, by the name in each.
function rowNames(): string[] {
  const [, body] = screen.getAllByRole("rowgroup");

  return within(body ?? document.body).getAllByRole("row").map((row: HTMLElement): string => within(row).getAllByRole("cell")[0]?.textContent ?? "");
}

describe("the users list", () => {
  it("shows a skeleton of the table, then the first page, newest first", async () => {
    const backend = serveUsers(TWENTY_FIVE_USERS);

    renderRoute("/users");

    expect(await screen.findByRole("table", { name: "Users" })).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("link", { name: "User 25" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Users" })).toHaveAttribute("aria-busy", "false");
    expect(rowNames()).toHaveLength(10);
    expect(rowNames()[0]).toBe("User 25");
    expect(screen.getByText("Page 1 of 3 · 25 results")).toBeInTheDocument();
    expect(lastListQuery(backend)).toEqual({ limit: "10" });
  });

  it("pages through the backend's pages, keeping the page in the URL", async () => {
    const user = userEvent.setup();
    const backend = serveUsers(TWENTY_FIVE_USERS);

    const { router } = renderRoute("/users");

    await screen.findByRole("link", { name: "User 25" });

    expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute("aria-disabled", "true");

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("link", { name: "User 15" })).toBeInTheDocument();
    expect(router.state.location.search).toEqual({ page: 2 });
    expect(lastListQuery(backend)).toEqual({ page: "2", limit: "10" });

    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(await screen.findByRole("link", { name: "User 25" })).toBeInTheDocument();
    expect(router.state.location.search).toEqual({});
  });

  it("searches from the first page", async () => {
    const user = userEvent.setup();
    const backend = serveUsers(TWENTY_FIVE_USERS);

    const { router } = renderRoute("/users?page=2");

    await screen.findByRole("link", { name: "User 15" });
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "user0");

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ search: "user0" });
    });

    expect(await screen.findByText("Page 1 of 1 · 9 results")).toBeInTheDocument();
    expect(lastListQuery(backend)).toEqual({ search: "user0", limit: "10" });
  });

  it("shows the search in the URL it opens with", async () => {
    serveUsers(TWENTY_FIVE_USERS);

    renderRoute("/users?search=%22user1%22");

    expect(await screen.findByRole("searchbox", { name: "Search" })).toHaveValue("user1");
  });

  it("keeps one history entry for a search however it is refined, and Back leaves it", async () => {
    const user = userEvent.setup();

    serveUsers(TWENTY_FIVE_USERS);

    const { router } = renderRoute("/users");

    const searchbox = await screen.findByRole("searchbox", { name: "Search" });

    // Each term in one change, so each commits once however slowly keys arrive.
    await user.click(searchbox);
    await user.paste("user1");

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ search: "user1" });
    });

    await user.tripleClick(searchbox);
    await user.paste("user2");

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ search: "user2" });
    });

    router.history.back();

    await waitFor(() => {
      expect(router.state.location.search).toEqual({});
    });

    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("");
  });

  it("filters by status from the first page, and clears the filter", async () => {
    const user = userEvent.setup();
    const backend = serveUsers([...buildUserDTOs(3), buildUserDTO({ id: "suspended", name: "Sam Suspended", status: "suspended" })]);

    const { router } = renderRoute("/users?page=1");

    await screen.findByRole("link", { name: "Sam Suspended" });
    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Suspended" }));

    await waitFor(() => {
      expect(rowNames()).toEqual(["Sam Suspended"]);
    });

    expect(router.state.location.search).toEqual({ status: "suspended" });
    expect(lastListQuery(backend)).toEqual({ status: "suspended", limit: "10" });

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "All statuses" }));

    await waitFor(() => {
      expect(rowNames()).toHaveLength(4);
    });

    expect(router.state.location.search).toEqual({});
  });

  it("sorts by a column, ascending first and then the other way", async () => {
    const user = userEvent.setup();
    const backend = serveUsers(TWENTY_FIVE_USERS);

    const { router } = renderRoute("/users?page=3");

    await screen.findByRole("link", { name: "User 05" });

    expect(screen.getByRole("columnheader", { name: "Created" })).toHaveAttribute("aria-sort", "descending");

    await user.click(screen.getByRole("button", { name: "Name" }));

    await waitFor(() => {
      expect(rowNames()[0]).toBe("User 01");
    });

    expect(router.state.location.search).toEqual({ sortBy: "name", sortOrder: "asc" });
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("columnheader", { name: "Created" })).not.toHaveAttribute("aria-sort");

    await user.click(screen.getByRole("button", { name: "Name" }));

    await waitFor(() => {
      expect(rowNames()[0]).toBe("User 25");
    });

    expect(lastListQuery(backend)).toEqual({ sortBy: "name", sortOrder: "desc", limit: "10" });
  });

  it("leaves the backend's default order out of the URL and the request", async () => {
    const user = userEvent.setup();
    const backend = serveUsers(TWENTY_FIVE_USERS);

    const { router } = renderRoute("/users");

    await screen.findByRole("link", { name: "User 25" });
    await user.click(screen.getByRole("button", { name: "Created" }));

    await waitFor(() => {
      expect(rowNames()[0]).toBe("User 01");
    });

    await user.click(screen.getByRole("button", { name: "Created" }));

    await waitFor(() => {
      expect(rowNames()[0]).toBe("User 25");
    });

    expect(router.state.location.search).toEqual({});
    expect(screen.getByRole("columnheader", { name: "Created" })).toHaveAttribute("aria-sort", "descending");
    expect(lastListQuery(backend)).toEqual({ limit: "10" });
  });

  it("drops a parameter the URL carries that does not parse, instead of sending it", async () => {
    const backend = serveUsers(TWENTY_FIVE_USERS);

    renderRoute("/users?page=0&status=%22deleted%22&sortBy=%22password%22");

    await screen.findByRole("link", { name: "User 25" });

    expect(lastListQuery(backend)).toEqual({ limit: "10" });
  });

  it("says so when nothing matches", async () => {
    serveUsers(TWENTY_FIVE_USERS);

    renderRoute("/users?search=%22nobody%22");

    expect(await screen.findByText("No users found")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows why the list failed in its place, and loads it again on retry", async () => {
    const user = userEvent.setup();
    let isFailing = true;

    server.use(http.get(USERS_URL, (): MockedResponse => {
      if (!isFailing) {
        return HttpResponse.json(buildPageDTO<UserDTO>());
      }

      return problem({ status: 400, title: "Bad Request", detail: "The search is too long", code: "common.validation_error" });
    }));

    renderRoute("/users");

    expect(await screen.findByRole("alert")).toHaveTextContent("The search is too long");

    isFailing = false;

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("No users found")).toBeInTheDocument();
  });
});

describe("the users list, by permission", () => {
  it("offers to create a user only to someone allowed to", async () => {
    server.use(signedIn(buildSessionDTO({ permissions: ["users:read"] })));
    serveUsers(TWENTY_FIVE_USERS);

    renderRoute("/users");

    await screen.findByRole("link", { name: "User 25" });

    expect(screen.queryByRole("link", { name: "Create user" })).not.toBeInTheDocument();
  });

  it("links to the list from the navigation only for someone who may read it", async () => {
    server.use(signedIn(buildSessionDTO({ permissions: [] })));

    renderRoute("/");

    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Main" })).queryByRole("link")).not.toBeInTheDocument();
  });

  it("refuses the page to someone who may not read users, without asking the backend for them", async () => {
    const warning = expectRouteFailureWarning();

    server.use(signedIn(buildSessionDTO({ permissions: [] })));

    const backend = serveUsers(TWENTY_FIVE_USERS);

    const { router } = renderRoute("/users");

    expect(await screen.findByText("You don't have access")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/users");
    expect(backend.listQueries).toEqual([]);
    warning.assertWarned();
  });

  it("goes to the list from the navigation", async () => {
    const user = userEvent.setup();

    serveUsers(TWENTY_FIVE_USERS);
    renderRoute("/");

    await user.click(await screen.findByRole("link", { name: "Users" }));

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
  });
});
