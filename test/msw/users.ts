import { http, HttpResponse } from "msw";

import type { ProblemDetailsDTO, UserDTO } from "@/common/api/schema.gen";

import { buildProblemDetails } from "@test/builders/problem-details.builder";
import { buildUserDTO } from "@test/builders/user.builder";

import type { HttpHandler } from "msw";

export const USERS_URL = "http://api.test/api/v1/users";
export const USER_URL = "http://api.test/api/v1/users/:id";

const DEFAULT_LIMIT = 10;
const CREATED_ID = "01890a5d-ac96-774b-bcce-b3020990ffff";

export function problem(overrides: Partial<ProblemDetailsDTO>): HttpResponse<ProblemDetailsDTO> {
  const body = buildProblemDetails(overrides);

  return HttpResponse.json(body, { status: body.status, headers: { "Content-Type": "application/problem+json" } });
}

export function userNotFound(): HttpResponse<ProblemDetailsDTO> {
  return problem({ status: 404, title: "Not Found", detail: "The user was not found", code: "users.user_not_found" });
}

type UsersBackend = {
  handlers: HttpHandler[];
  // Every list request's query, as the backend received it.
  listQueries: URLSearchParams[];
  createBodies: unknown[];
  updateBodies: unknown[];
};

function compareBy(sortBy: string, sortOrder: string): (a: UserDTO, b: UserDTO) => number {
  const field = sortBy === "name" || sortBy === "email" ? sortBy : "createdAt";
  const direction = sortOrder === "asc" ? 1 : -1;

  return (a: UserDTO, b: UserDTO): number => a[field].localeCompare(b[field]) * direction;
}

type UsersBackendOptions = {
  // Awaited before a create is answered, so a test can look at the screen while it is in flight.
  holdCreate?: Promise<void>;
};

// The users endpoints over an in-memory list, filtering, sorting and paging the way the backend
// does — enough for a screen to behave as it would against the real one.
export function usersBackend(initial: UserDTO[], { holdCreate }: UsersBackendOptions = {}): UsersBackend {
  const users = [...initial];
  const backend: UsersBackend = { handlers: [], listQueries: [], createBodies: [], updateBodies: [] };

  backend.handlers = [
    http.get(USERS_URL, ({ request }: { request: Request }) => {
      const query = new URL(request.url).searchParams;

      backend.listQueries.push(query);

      const page = Number(query.get("page") ?? 1);
      const limit = Number(query.get("limit") ?? DEFAULT_LIMIT);
      const search = query.get("search")?.toLowerCase();
      const status = query.get("status");

      const matching = users
        .filter((user: UserDTO): boolean => search === undefined || `${user.name} ${user.email}`.toLowerCase().includes(search))
        .filter((user: UserDTO): boolean => status === null || user.status === status)
        .sort(compareBy(query.get("sortBy") ?? "createdAt", query.get("sortOrder") ?? "desc"));

      const pages = Math.ceil(matching.length / limit);

      return HttpResponse.json({
        data: matching.slice((page - 1) * limit, page * limit),
        pagination: {
          total: matching.length,
          pages,
          page,
          limit,
          next: page < pages ? page + 1 : null,
          previous: page > 1 ? page - 1 : null,
        },
      });
    }),
    http.get(USER_URL, ({ params }: { params: Record<string, string | readonly string[] | undefined> }) => {
      const user = users.find((candidate: UserDTO): boolean => candidate.id === params.id);

      return user === undefined ? userNotFound() : HttpResponse.json({ data: user });
    }),
    http.post(USERS_URL, async ({ request }: { request: Request }) => {
      const body = await request.json() as { name: string; email: string };

      await holdCreate;

      backend.createBodies.push(body);
      users.push(buildUserDTO({ id: CREATED_ID, name: body.name, email: body.email, createdAt: new Date().toISOString() }));

      return HttpResponse.json({ data: { id: CREATED_ID } }, { status: 201 });
    }),
    http.patch(USER_URL, async ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => {
      const body = await request.json() as { email: string };
      const index = users.findIndex((candidate: UserDTO): boolean => candidate.id === params.id);
      const user = users[index];

      backend.updateBodies.push(body);

      if (user === undefined) {
        return userNotFound();
      }

      users[index] = { ...user, email: body.email };

      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return backend;
}
