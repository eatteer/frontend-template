import { z } from "zod";

import type { TFunction } from "i18next";

// What the fields hold and what the backend receives are the same here: two strings, nothing to
// convert. Every field is declared, since one that starts `undefined` and then receives a string
// switches from uncontrolled to controlled.
export type SignInValues = {
  email: string;
  password: string;
};

export const SIGN_IN_DEFAULT_VALUES: SignInValues = { email: "", password: "" };

export function buildSignInSchema(t: TFunction<"auth">): z.ZodType<SignInValues, SignInValues> {
  return z.object({
    email: z.email({ error: t("sign_in.errors.email_invalid") }),
    password: z.string().min(1, { error: t("sign_in.errors.password_required") }),
  });
}
