export const LANGUAGE_VALUES = ["en", "es"] as const;

export type Language = (typeof LANGUAGE_VALUES)[number];

// The backend's own fallback, so both sides agree on what a reader with no match gets.
export const DEFAULT_LANGUAGE: Language = "en";

// Each language in its own words, so a reader lost in the other one still finds theirs.
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  es: "Español",
};

export function isLanguage(value: string): value is Language {
  return (LANGUAGE_VALUES as readonly string[]).includes(value);
}

// A choice the reader made wins; then the first browser language this application speaks, matched
// on its primary subtag (`es-CO` is `es`); then the default.
export function detectLanguage(stored: string | null, browserLanguages: readonly string[]): Language {
  if (stored !== null && isLanguage(stored)) {
    return stored;
  }

  const primarySubtags = browserLanguages.map((language: string): string => language.toLowerCase().replace(/-.*$/, ""));

  return primarySubtags.find(isLanguage) ?? DEFAULT_LANGUAGE;
}
