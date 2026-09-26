export const LANGUAGE_VALUES = ["en", "es"] as const;

export type LanguageValue = (typeof LANGUAGE_VALUES)[number];

// The backend's own fallback, so both sides agree on what a reader with no match gets.
export const DEFAULT_LANGUAGE: LanguageValue = "en";

// Each language in its own words, so a reader lost in the other one still finds theirs.
export const LANGUAGE_LABELS: Record<LanguageValue, string> = {
  en: "English",
  es: "Español",
};

export function isLanguageValue(value: string): value is LanguageValue {
  return (LANGUAGE_VALUES as readonly string[]).includes(value);
}

// A choice the reader made wins; then the first browser language this application speaks, matched
// on its primary subtag (`es-CO` is `es`); then the default.
export function detectLanguage(stored: string | null, browserLanguages: readonly string[]): LanguageValue {
  if (stored !== null && isLanguageValue(stored)) {
    return stored;
  }

  const primarySubtags = browserLanguages.map((language: string): string => language.split("-")[0]?.toLowerCase() ?? "");

  return primarySubtags.find(isLanguageValue) ?? DEFAULT_LANGUAGE;
}
