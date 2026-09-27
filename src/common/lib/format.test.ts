import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, formatMoney, formatNumber } from "@/common/lib/format";

const UTC = { timeZone: "UTC" } as const;
const ISO_DATE = "2026-03-05T14:30:00.000Z";

// Intl separates a currency from its amount with a non-breaking space in some locales.
function normalizeSpaces(text: string): string {
  return text.replace(/\s/g, " ");
}

describe("formatDate", () => {
  it("formats in the reader's language", () => {
    expect(formatDate(ISO_DATE, "en", { dateStyle: "medium", ...UTC })).toBe("Mar 5, 2026");
    expect(formatDate(ISO_DATE, "es", { dateStyle: "medium", ...UTC })).toBe("5 mar 2026");
  });

  it("shows the reader's own time zone by default", () => {
    expect(formatDate(ISO_DATE, "en")).toBe(new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(ISO_DATE)));
    expect(formatDateTime(ISO_DATE, "en")).toContain("2026");
  });
});

describe("formatNumber", () => {
  it("groups digits the way the language does", () => {
    expect(formatNumber(1234567.5, "en")).toBe("1,234,567.5");
    expect(formatNumber(1234567.5, "es")).toBe("1.234.567,5");
  });
});

describe("formatMoney", () => {
  it.each([
    [{ amountMinor: "12345", currency: "USD" }, "$123.45"],
    [{ amountMinor: "5", currency: "USD" }, "$0.05"],
    [{ amountMinor: "-250", currency: "USD" }, "-$2.50"],
    [{ amountMinor: "1500", currency: "JPY" }, "¥1,500"],
    [{ amountMinor: "1234", currency: "KWD" }, "KWD 1.234"],
  ])("places the decimal point where the currency puts it: %o", (money: { amountMinor: string; currency: string }, expected: string) => {
    expect(normalizeSpaces(formatMoney(money, "en"))).toBe(expected);
  });

  it("never rounds an amount too large for a float", () => {
    expect(formatMoney({ amountMinor: "900719925474099312", currency: "USD" }, "en")).toBe("$9,007,199,254,740,993.12");
  });

  it("refuses something that is not an amount", () => {
    expect(() => formatMoney({ amountMinor: "12a", currency: "USD" }, "en")).toThrow("Not an amount in minor units");
  });
});
