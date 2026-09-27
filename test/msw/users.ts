import { http, HttpResponse } from "msw";

import type { CreateUserDto, ProblemDetailsDto, UpdateUserDto, UserDto } from "@/common/api/schema.gen";

import { buildPageDto, DEFAULT_PAGE_LIMIT } from "@test/builders/page.builder";
import { buildUserDto } from "@test/builders/user.builder";
import { API_URL, problem } from "@test/msw/api";
import type { MockedResponse } from "@test/msw/api";
import { server } from "@test/msw/server";

import type { HttpHandler, StrictRequest } from "msw";

export const USERS_URL = `${API_URL}/users`;
export const USER_URL = `${API_URL}/users/:id`;

const CREATED_ID = "01890a5d-ac96-774b-bcce-b3020990ffff";

type UserParams = { id: string };

export function userNotFound(): HttpResponse<ProblemDetailsDto> {
  return problem({ status: 404, title: "Not Found", detail: "The user was not found", code: "users.user_not_found" });
}

export type UsersBackend = {
  handlers: HttpHandler[];
  // Every list request's query, as the backend received it.
  listQueries: URLSearchParams[];
  createBodies: CreateUserDto[];
  updateBodies: UpdateUserDto[];
};

function compareBy(sortBy: string, sortOrder: string): (left: UserDto, right: UserDto) => number {
  const field = sortBy === "name" || sortBy === "email" ? sortBy : "createdAt";
  const direction = sortOrder === "asc" ? 1 : -1;

  return (left: UserDto, right: UserDto): number => left[field].localeCompare(right[field]) * direction;
}

type UsersBackendOptions = {
  // Awaited before a create is answered, so a test can look at the screen while it is in flight.
  holdCreate?: Promise<void>;
};

// The users endpoints over an in-memory list, filtering, sorting and paging the way the backend
// does — enough for a screen to behave as it would against the real one.
export function usersBackend(initial: UserDto[], { holdCreate }: UsersBackendOptions = {}): UsersBackend {
  const users = [...initial];
  const backend: UsersBackend = { handlers: [], listQueries: [], createBodies: [], updateBodies: [] };

  backend.handlers = [
    http.get(USERS_URL, ({ request }: { request: Request }): MockedResponse => {
      const query = new URL(request.url).searchParams;

      backend.listQueries.push(query);

      const page = Number(query.get("page") ?? 1);
      const limit = Number(query.get("limit") ?? DEFAULT_PAGE_LIMIT);
      const search = query.get("search")?.toLowerCase();
      const status = query.get("status");

      const matching = users
        .filter((user: UserDto): boolean => search === undefined || `${user.name} ${user.email}`.toLowerCase().includes(search))
        .filter((user: UserDto): boolean => status === null || user.status === status)
        .sort(compareBy(query.get("sortBy") ?? "createdAt", query.get("sortOrder") ?? "desc"));

      const pages = Math.ceil(matching.length / limit);

      return HttpResponse.json(buildPageDto(matching.slice((page - 1) * limit, page * limit), {
        total: matching.length,
        pages,
        page,
        limit,
        next: page < pages ? page + 1 : null,
        previous: page > 1 ? page - 1 : null,
      }));
    }),
    http.get<UserParams>(USER_URL, ({ params }: { params: UserParams }): MockedResponse => {
      const user = users.find((candidate: UserDto): boolean => candidate.id === params.id);

      return user === undefined ? userNotFound() : HttpResponse.json({ data: user });
    }),
    http.post<never, CreateUserDto>(USERS_URL, async ({ request }: { request: StrictRequest<CreateUserDto> }): Promise<MockedResponse> => {
      const body = await request.json();

      await holdCreate;

      backend.createBodies.push(body);

      users.push(buildUserDto({ id: CREATED_ID, name: body.name, email: body.email, createdAt: new Date().toISOString() }));

      return HttpResponse.json({ data: { id: CREATED_ID } }, { status: 201 });
    }),
    http.patch<UserParams, UpdateUserDto>(
      USER_URL,
      async ({ request, params }: { request: StrictRequest<UpdateUserDto>; params: UserParams }): Promise<MockedResponse> => {
        const body = await request.json();

        const index = users.findIndex((candidate: UserDto): boolean => candidate.id === params.id);
        const user = users[index];

        backend.updateBodies.push(body);

        if (user === undefined) {
          return userNotFound();
        }

        users[index] = { ...user, email: body.email ?? user.email };

        return new HttpResponse(null, { status: 204 });
      },
    ),
  ];

  return backend;
}

// The users endpoints over `users`, in front of every other handler for the rest of the test.
export function serveUsers(users: UserDto[], options?: UsersBackendOptions): UsersBackend {
  const backend = usersBackend(users, options);

  server.use(...backend.handlers);

  return backend;
}
