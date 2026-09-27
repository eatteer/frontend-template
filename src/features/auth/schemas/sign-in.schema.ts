import { z } from "zod";

import type { TFunction } from "i18next";

// Every field is declared, since one that starts `undefined` and then receives a string switches from
// uncontrolled to controlled.
export type SignInFormInput = {
  email: string;
  password: string;
};

// The same two strings the fields hold: there is nothing to convert.
export type SignInValues = {
  email: string;
  password: string;
};

export const SIGN_IN_DEFAULT_VALUES: SignInFormInput = { email: "", password: "" };

export const SIGN_IN_FIELDS = ["email", "password"] as const satisfies readonly (keyof SignInFormInput)[];

export function buildSignInSchema(t: TFunction<"auth">): z.ZodType<SignInValues, SignInFormInput> {
  return z.object({
    email: z.email({ error: t("sign_in.errors.email_invalid") }),
    password: z.string().min(1, { error: t("sign_in.errors.password_required") }),
  });
}
