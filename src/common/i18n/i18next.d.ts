import type auth from "@/locales/en/auth.json";
import type common from "@/locales/en/common.json";

// English is the reference locale: its files define which keys exist, and the parity test makes the
// others match. A key that is not here is a compile error at `t()`.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      auth: typeof auth;
      common: typeof common;
    };
  }
}
