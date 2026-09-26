import { describe, expect, it } from "vitest";

import { MISSING_DATA_MESSAGE, unwrap } from "@/common/api/envelope";

describe("unwrap", () => {
  it("returns what the envelope carries", () => {
    expect(unwrap({ data: { data: { id: "01890a5d" } } })).toEqual({ id: "01890a5d" });
  });

  it("refuses a result without a body", () => {
    expect(() => unwrap({})).toThrow(MISSING_DATA_MESSAGE);
  });
});
