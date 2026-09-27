import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import type { ProblemDetailsDTO, SessionDTO, UserDTO } from "@/common/api/schema.gen";
import { userQueries } from "@/features/users/api/user-queries";

import { buildSessionDTO } from "@test/builders/session.builder";
import { buildUserDTO, buildUserDTOs } from "@test/builders/user.builder";
import { problem } from "@test/msw/api";
import type { MockedResponse } from "@test/msw/api";
import { server } from "@test/msw/server";
import { SESSION_URL, signedIn } from "@test/msw/session";
import { serveUsers, USER_URL, USERS_URL } from "@test/msw/users";
import { renderRoute } from "@test/render";
import { expectRouteFailureWarning } from "@test/route-failure-warning";

import type { UserEvent } from "@testing-library/user-event";

const JANE = buildUserDTO();

// Past the router's pending delay, which holds a skeleton back so a fast answer never flashes one.
const SKELETON_TIMEOUT_MS = 3000;

// The users the backend holds unless a test says otherwise: Jane, whose pages the tests open, and a few more.
const USERS = [JANE, ...buildUserDTOs(3)];

async function fillCreateForm(user: UserEvent, { name, email, password }: { name: string; email: string; password: string }): Promise<void> {
  await user.type(await screen.findByLabelText("Name"), name);
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
}

async function chooseLanguage(user: UserEvent, language: string): Promise<void> {
  await user.click(screen.getByRole("combobox", { name: "Language" }));
  await user.click(await screen.findByRole("option", { name: language }));
}

describe("creating a user", () => {
  it("creates them behind the fullscreen loader, shows them, and marks every list out of date", async () => {
    const user = userEvent.setup();

    let answer: (() => void) | undefined;

    const answered = new Promise<void>((resolve: () => void): void => {
      answer = resolve;
    });

    const backend = serveUsers(USERS, { holdCreate: answered });

    const { router, queryClient } = renderRoute("/users");

    await user.click(await screen.findByRole("link", { name: "Create user" }));

    await fillCreateForm(user, { name: "Ada Lovelace", email: "ada@example.com", password: "Change-me-1!" });

    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByRole("status", { name: "Saving…" })).toBeInTheDocument();

    if (answer) {
      answer();
    }

    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Saving…" })).not.toBeInTheDocument();

    expect(router.state.location.pathname).toBe("/users/01890a5d-ac96-774b-bcce-b3020990ffff");

    expect(queryClient.getQueryState(userQueries.list({}).queryKey)?.isInvalidated).toBe(true);

    expect(backend.createBodies).toEqual([{ name: "Ada Lovelace", email: "ada@example.com", password: "Change-me-1!" }]);
  });

  it("sends the language chosen for the account", async () => {
    const user = userEvent.setup();

    const backend = serveUsers(USERS);

    renderRoute("/users/new");

    await fillCreateForm(user, { name: "Ada Lovelace", email: "ada@example.com", password: "Change-me-1!" });
    await chooseLanguage(user, "Español");

    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();

    expect(backend.createBodies).toEqual([expect.objectContaining({ preferredLanguage: "es" })]);
  });

  it("leaves the language to the backend when the choice is taken back", async () => {
    const user = userEvent.setup();

    const backend = serveUsers(USERS);

    renderRoute("/users/new");

    expect(await screen.findByRole("combobox", { name: "Language" })).toHaveTextContent("The application's default");

    await chooseLanguage(user, "Español");
    await chooseLanguage(user, "The application's default");
    await fillCreateForm(user, { name: "Ada Lovelace", email: "ada@example.com", password: "Change-me-1!" });

    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();

    expect(backend.createBodies).toEqual([{ name: "Ada Lovelace", email: "ada@example.com", password: "Change-me-1!" }]);
  });

  it("checks the fields before sending anything, and focuses the first one wrong", async () => {
    const user = userEvent.setup();

    const backend = serveUsers(USERS);

    renderRoute("/users/new");

    await user.type(await screen.findByLabelText("Password"), "short");

    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("Enter a name")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Use at least 8 characters");
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Name")).toHaveFocus();

    expect(backend.createBodies).toEqual([]);
  });

  it("puts the backend's field errors on their fields, without a toast", async () => {
    const user = userEvent.setup();

    serveUsers(USERS);

    server.use(http.post(USERS_URL, (): HttpResponse<ProblemDetailsDTO> => problem({
      status: 400,
      title: "Bad Request",
      detail: "Validation failed",
      code: "common.validation_error",
      errors: [{ field: "password", message: "The password is too long (72 bytes at most)" }],
    })));

    renderRoute("/users/new");

    await fillCreateForm(user, { name: "Ada Lovelace", email: "ada@example.com", password: "a".repeat(80) });

    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("The password is too long (72 bytes at most)")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveFocus();
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Validation failed")).not.toBeInTheDocument();
  });

  it("explains an email already registered in a toast, since no field would", async () => {
    const user = userEvent.setup();

    serveUsers(USERS);

    server.use(http.post(USERS_URL, (): HttpResponse<ProblemDetailsDTO> => problem({})));

    renderRoute("/users/new");

    await fillCreateForm(user, { name: "Jane Doe", email: "jane@example.com", password: "Change-me-1!" });

    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The email is already registered");
    expect(screen.getByRole("button", { name: "Copy error", hidden: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("heading", { name: "Create user" })).toBeInTheDocument();
  });

  it("refuses the page to someone who may not create users", async () => {
    const warning = expectRouteFailureWarning();

    server.use(signedIn(buildSessionDTO({ permissions: ["users:read"] })));

    serveUsers(USERS);

    renderRoute("/users/new");

    expect(await screen.findByText("You don't have access")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();

    warning.assertWarned();
  });
});

describe("a user's page", () => {
  it("shows the user, with a way to edit them for someone allowed to", async () => {
    serveUsers(USERS);

    renderRoute(`/users/${JANE.id}`);

    expect(await screen.findByRole("heading", { name: "Jane Doe" })).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", `/users/${JANE.id}/edit`);
  });

  it("leaves out the edit link for someone who may only read", async () => {
    server.use(signedIn(buildSessionDTO({ permissions: ["users:read"] })));

    serveUsers(USERS);

    renderRoute(`/users/${JANE.id}`);

    expect(await screen.findByRole("heading", { name: "Jane Doe" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("shows a skeleton of the page while a slow answer is on its way", async () => {
    let answer: (() => void) | undefined;

    const answered = new Promise<void>((resolve: () => void): void => {
      answer = resolve;
    });

    serveUsers(USERS);

    server.use(http.get(USER_URL, async (): Promise<HttpResponse<{ data: UserDTO }>> => {
      await answered;

      return HttpResponse.json({ data: JANE });
    }));

    const { container } = renderRoute(`/users/${JANE.id}`);

    // A description list has no role to find it by, so the skeleton's is found by its element. The
    // router holds the page back for a moment before showing it, so a fast answer never flashes one.
    await waitFor(() => {
      expect(container.querySelector("dl[aria-busy='true']")).toBeInTheDocument();
    }, { timeout: SKELETON_TIMEOUT_MS });

    if (answer) {
      answer();
    }

    expect(await screen.findByRole("heading", { name: "Jane Doe" })).toBeInTheDocument();
    expect(container.querySelector("[aria-busy='true']")).not.toBeInTheDocument();
  });

  it("says the page does not exist when the backend has no such user", async () => {
    const warning = expectRouteFailureWarning();

    serveUsers(USERS);

    renderRoute("/users/missing");

    expect(await screen.findByText("Page not found")).toBeInTheDocument();

    warning.assertWarned();
  });
});

describe("editing a user", () => {
  it("opens with the user's email, saves a change and shows the user again", async () => {
    const user = userEvent.setup();

    const backend = serveUsers(USERS);

    const { router } = renderRoute(`/users/${JANE.id}`);

    await user.click(await screen.findByRole("link", { name: "Edit" }));

    const email = await screen.findByLabelText("Email");

    expect(email).toHaveValue("jane@example.com");
    expect(screen.getByRole("button", { name: "Save changes" })).toHaveAttribute("aria-disabled", "true");

    await user.clear(email);
    await user.type(email, "jane.doe@example.com");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("jane.doe@example.com")).toBeInTheDocument();

    expect(router.state.location.pathname).toBe(`/users/${JANE.id}`);

    expect(backend.updateBodies).toEqual([{ email: "jane.doe@example.com" }]);
  });

  it("puts the backend's field errors on the field, and the rest in a toast", async () => {
    const user = userEvent.setup();

    serveUsers(USERS);

    let answer = problem({ status: 400, code: "common.validation_error", errors: [{ field: "email", message: "The email is not valid" }] });

    server.use(http.patch(USER_URL, (): MockedResponse => answer));

    renderRoute(`/users/${JANE.id}/edit`);

    const email = await screen.findByLabelText("Email");

    await user.clear(email);
    await user.type(email, "taken@example.com");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("The email is not valid")).toBeInTheDocument();
    expect(email).toHaveFocus();

    answer = problem();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The email is already registered");
    expect(screen.queryByText("The email is not valid")).not.toBeInTheDocument();
  });

  it("reads the session again after an administrator edits their own account", async () => {
    const user = userEvent.setup();

    const session = buildSessionDTO();
    let sessionReads = 0;

    serveUsers([buildUserDTO({ id: session.user.id, name: session.user.name, email: session.user.email })]);

    server.use(http.get(SESSION_URL, (): HttpResponse<{ data: SessionDTO }> => {
      sessionReads += 1;

      return HttpResponse.json({ data: session });
    }));

    renderRoute(`/users/${session.user.id}/edit`);

    const email = await screen.findByLabelText("Email");

    await user.clear(email);
    await user.type(email, "root@example.com");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { name: session.user.name })).toBeInTheDocument();

    await waitFor(() => {
      expect(sessionReads).toBe(2);
    });
  });

  it("refuses the page to someone who may not edit users", async () => {
    const warning = expectRouteFailureWarning();

    server.use(signedIn(buildSessionDTO({ permissions: ["users:read"] })));

    serveUsers(USERS);

    renderRoute(`/users/${JANE.id}/edit`);

    expect(await screen.findByText("You don't have access")).toBeInTheDocument();
    expect(within(document.body).queryByLabelText("Email")).not.toBeInTheDocument();

    warning.assertWarned();
  });
});
