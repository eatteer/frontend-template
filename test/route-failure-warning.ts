import { expect, vi } from "vitest";

type RouteFailureWarning = {
  assertWarned: () => void;
};

// Outside production the router warns about every route that failed, which is what a refused or a
// missing page is. A test that expects one takes the call from the console guard and asserts it.
export function expectRouteFailureWarning(): RouteFailureWarning {
  const warn = vi.spyOn(console, "warn").mockImplementation((): void => {});

  return {
    assertWarned: (): void => {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Error in route match"));
    },
  };
}
