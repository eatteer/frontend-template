import { describe, expect, it } from "vitest";

import { createTraceparent, traceIdOf } from "@/common/api/traceparent";

const TRACEPARENT_FORMAT = /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/;

describe("createTraceparent", () => {
  it("writes a sampled W3C trace context", () => {
    expect(createTraceparent()).toMatch(TRACEPARENT_FORMAT);
  });

  it("starts a new trace every time", () => {
    expect(traceIdOf(createTraceparent())).not.toBe(traceIdOf(createTraceparent()));
  });
});

describe("traceIdOf", () => {
  it("reads the trace id out of a trace context", () => {
    expect(traceIdOf("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01")).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
  });

  it("has nothing to read without one", () => {
    expect(traceIdOf(null)).toBeUndefined();
  });
});
