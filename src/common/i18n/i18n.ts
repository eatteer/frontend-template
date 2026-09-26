import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { detectLanguage } from "@/common/i18n/languages";
import type { LanguageValue } from "@/common/i18n/languages";

import type { Resource, ResourceKey } from "i18next";

const LANGUAGE_STORAGE_KEY = "language";
const DEFAULT_NAMESPACE = "common";

// Bundled instead of fetched per namespace: a namespace that arrives after its consumer has mounted
// suspends the tree that is already on screen. Shipping every namespace leaves nothing to arrive late.
const LOCALE_MODULES = import.meta.glob<ResourceKey>("/src/locales/*/*.json", { eager: true, import: "default" });

// `/src/locales/<language>/<namespace>.json` → `{ [language]: { [namespace]: translations } }`.
export function buildResources(modules: Record<string, ResourceKey>): Resource {
  return Object.entries(modules).reduce<Resource>(
    (resources: Resource, [path, translations]: [string, ResourceKey]): Resource => {
      const [language, fileName] = path.split("/").slice(-2);

      if (language === undefined || fileName === undefined) {
        return resources;
      }

      return {
        ...resources,
        [language]: { ...resources[language], [fileName.replace(/\.json$/, "")]: translations },
      };
    },
    {},
  );
}

function applyDocumentLanguage(language: string): void {
  document.documentElement.lang = language;
}

// Also the next visit's starting point: a reload paints in the last language applied, the account's
// included, before the session has been read. Applying the language already in place writes nothing.
export async function changeLanguage(language: LanguageValue): Promise<void> {
  if (localStorage.getItem(LANGUAGE_STORAGE_KEY) !== language) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  if (i18next.language !== language) {
    await i18next.changeLanguage(language);
  }
}

void i18next.use(initReactI18next).init({
  resources: buildResources(LOCALE_MODULES),
  lng: detectLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY), navigator.languages),
  defaultNS: DEFAULT_NAMESPACE,
  // The resources are in the bundle, so there is nothing to wait for: initialising synchronously
  // means the first render already has its translations.
  initAsync: false,
  interpolation: {
    // React escapes what it renders; escaping here as well would show entities on screen.
    escapeValue: false,
  },
});

// Also for the language resolved at startup: `languageChanged` fires only on later changes.
applyDocumentLanguage(i18next.language);

i18next.on("languageChanged", applyDocumentLanguage);

export { i18next as i18n };
