import { describe, expect, it } from "vitest";

import { MISSING_DATA_MESSAGE } from "@/common/api/envelope";
import { mapPage, unwrapPage } from "@/common/api/pagination";
import type { Pagination } from "@/common/api/pagination";

const PAGINATION: Pagination = { total: 21, pages: 3, page: 2, limit: 10, next: 3, previous: 1 };

describe("unwrapPage", () => {
  it("keeps the items and the pagination together", () => {
    expect(unwrapPage({ data: { data: ["a", "b"], pagination: PAGINATION } })).toEqual({
      items: ["a", "b"],
      pagination: PAGINATION,
    });
  });

  it("refuses a result without a body", () => {
    expect(() => unwrapPage({})).toThrow(MISSING_DATA_MESSAGE);
  });
});

describe("mapPage", () => {
  it("maps the items and leaves the pagination alone", () => {
    const page = mapPage({ items: [1, 2], pagination: PAGINATION }, (value: number): string => `#${value}`);

    expect(page).toEqual({ items: ["#1", "#2"], pagination: PAGINATION });
  });
});
