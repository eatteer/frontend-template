import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useFormatters } from "@/common/hooks/use-formatters";
import { changeLanguage } from "@/common/i18n/i18n";

const UTC = { timeZone: "UTC" } as const;
const ISO_DATE = "2026-03-05T14:30:00.000Z";

// Intl separates a currency from its amount with a non-breaking space in some locales.
function normalizeSpaces(text: string): string {
  return text.replace(/\s/g, " ");
}

describe("useFormatters", () => {
  it("formats in the language on screen and follows it when it changes", async () => {
    const { result, rerender } = renderHook(useFormatters);

    expect(result.current.number(1.5)).toBe("1.5");

    await changeLanguage("es");
    rerender();

    expect(result.current.number(1.5)).toBe("1,5");
    expect(normalizeSpaces(result.current.money({ amountMinor: "150", currency: "EUR" }))).toBe("1,50 €");
    expect(result.current.date(ISO_DATE, { dateStyle: "long", ...UTC })).toBe("5 de marzo de 2026");
    expect(result.current.dateTime(ISO_DATE)).toContain("2026");
  });
});
