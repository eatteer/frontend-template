import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LANGUAGE_VALUES } from "@/common/i18n/languages";

type Translations = { [key: string]: string | Translations };

const LOCALES_DIRECTORY = join(import.meta.dirname, "..", "src", "locales");
const REFERENCE_LANGUAGE = "en";
const PLURAL_SEPARATOR = "_";

function readNamespace(language: string, fileName: string): Translations {
  return JSON.parse(readFileSync(join(LOCALES_DIRECTORY, language, fileName), "utf8"));
}

function flattenKeys(translations: Translations, prefix: string = ""): string[] {
  return Object.entries(translations).flatMap(([key, value]: [string, string | Translations]): string[] => {
    const path = prefix === "" ? key : `${prefix}.${key}`;

    return typeof value === "string" ? [path] : flattenKeys(value, path);
  });
}

// `items_one` / `items_other` are one key in two plural forms, and each language has its own set of
// forms — English has two, Spanish three. So keys are compared without their plural suffix, and each
// plural key is checked against the forms its own language uses.
function splitPlural(key: string, pluralForms: readonly string[]): { base: string; form: string | undefined } {
  const separatorAt = key.lastIndexOf(PLURAL_SEPARATOR);
  const form = key.slice(separatorAt + 1);

  if (separatorAt === -1 || !pluralForms.includes(form)) {
    return { base: key, form: undefined };
  }

  return { base: key.slice(0, separatorAt), form };
}

function pluralFormsOf(language: string): readonly string[] {
  return new Intl.PluralRules(language).resolvedOptions().pluralCategories;
}

type NamespaceShape = {
  keys: string[];
  pluralFormsByKey: Map<string, string[]>;
};

function describeNamespace(language: string, fileName: string): NamespaceShape {
  const pluralForms = pluralFormsOf(language);
  const pluralFormsByKey = new Map<string, string[]>();

  const keys = flattenKeys(readNamespace(language, fileName)).map((key: string): string => {
    const { base, form } = splitPlural(key, pluralForms);

    if (form !== undefined) {
      pluralFormsByKey.set(base, [...(pluralFormsByKey.get(base) ?? []), form]);
    }

    return base;
  });

  return { keys: [...new Set(keys)].sort(), pluralFormsByKey };
}

const namespaces = readdirSync(join(LOCALES_DIRECTORY, REFERENCE_LANGUAGE));

describe.each(namespaces)("locale namespace %s", (fileName: string) => {
  const reference = describeNamespace(REFERENCE_LANGUAGE, fileName);

  it.each(LANGUAGE_VALUES)("has the same keys in %s as in English", (language: string) => {
    expect(describeNamespace(language, fileName).keys).toEqual(reference.keys);
  });

  it.each(LANGUAGE_VALUES)("writes every plural in %s in all of its forms", (language: string) => {
    const { pluralFormsByKey } = describeNamespace(language, fileName);
    const expectedForms = [...pluralFormsOf(language)].sort();

    pluralFormsByKey.forEach((forms: string[], key: string): void => {
      expect({ key, forms: [...forms].sort() }).toEqual({ key, forms: expectedForms });
    });
  });
});

describe("the locales", () => {
  it("have a folder for every language and no other", () => {
    expect(readdirSync(LOCALES_DIRECTORY).sort()).toEqual([...LANGUAGE_VALUES].sort());
  });
});
