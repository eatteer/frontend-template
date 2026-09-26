const TRACEPARENT_VERSION = "00";
const SAMPLED_FLAGS = "01";
const TRACE_ID_BYTES = 16;
const SPAN_ID_BYTES = 8;
const HEX_RADIX = 16;
const HEX_BYTE_WIDTH = 2;

export const TRACEPARENT_HEADER = "traceparent";

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (byte: number): string => byte
    .toString(HEX_RADIX)
    .padStart(HEX_BYTE_WIDTH, "0"))
    .join("");
}

// A W3C trace context for one request. The backend continues this trace instead of starting its
// own, so the id a user copies from an error is the one the server logged — even when the request
// never got an answer.
export function createTraceparent(): string {
  return [TRACEPARENT_VERSION, randomHex(TRACE_ID_BYTES), randomHex(SPAN_ID_BYTES), SAMPLED_FLAGS].join("-");
}

export function traceIdOf(traceparent: string | null): string | undefined {
  return traceparent?.split("-")[1];
}
