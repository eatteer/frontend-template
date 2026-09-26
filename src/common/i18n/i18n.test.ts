import { describe, expect, it } from "vitest";

import { buildResources, changeLanguage, i18n } from "@/common/i18n/i18n";

describe("buildResources", () => {
  it("files each locale file under its language and namespace", () => {
    const resources = buildResources({
      "/src/locales/en/common.json": { title: "Title" },
      "/src/locales/es/common.json": { title: "Título" },
      "/src/locales/en/users.json": { list: "Users" },
    });

    expect(resources).toEqual({
      en: { common: { title: "Title" }, users: { list: "Users" } },
      es: { common: { title: "Título" } },
    });
  });

  it("skips a path that names no language", () => {
    expect(buildResources({ "common.json": { title: "Title" } })).toEqual({});
  });
});

describe("changeLanguage", () => {
  it("switches the translations, the document's language and the stored choice", async () => {
    await changeLanguage("es");

    expect(i18n.t("actions.retry")).toBe("Reintentar");
    expect(document.documentElement.lang).toBe("es");
    expect(localStorage.getItem("language")).toBe("es");
  });
});
