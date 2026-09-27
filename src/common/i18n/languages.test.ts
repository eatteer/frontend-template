import { describe, expect, it } from "vitest";

import { DEFAULT_LANGUAGE, detectLanguage, isLanguage } from "@/common/i18n/languages";

describe("detectLanguage", () => {
  it("keeps the language the reader chose", () => {
    expect(detectLanguage("es", ["en-US"])).toBe("es");
  });

  it("ignores a stored value it does not speak", () => {
    expect(detectLanguage("fr", ["es-CO"])).toBe("es");
  });

  it("takes the first browser language it speaks, by its primary subtag", () => {
    expect(detectLanguage(null, ["fr-FR", "ES-mx", "en"])).toBe("es");
  });

  it("falls back to the backend's default", () => {
    expect(detectLanguage(null, ["fr-FR", "de"])).toBe(DEFAULT_LANGUAGE);
    expect(detectLanguage(null, [])).toBe(DEFAULT_LANGUAGE);
  });
});

describe("isLanguage", () => {
  it("accepts only the languages the application speaks", () => {
    expect(isLanguage("en")).toBe(true);
    expect(isLanguage("es-CO")).toBe(false);
  });
});
