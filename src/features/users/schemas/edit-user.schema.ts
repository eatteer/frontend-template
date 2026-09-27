import { z } from "zod";

import type { User } from "@/features/users/model/user";

import type { TFunction } from "i18next";

// The email is all the backend lets an administrator change. The name, the language and the roles
// are someone else's call: the account's owner, or the roles screen.
export type EditUserFormInput = {
  email: string;
};

export type EditUserValues = {
  email: string;
};

export const EDIT_USER_FIELDS = ["email"] as const satisfies readonly (keyof EditUserFormInput)[];

// The form's starting values, taken from the user once it has loaded — the form mounts only then,
// so there is never a render with the fields empty and a reset to fill them.
export function toEditUserFormInput(user: User): EditUserFormInput {
  return { email: user.email };
}

export function buildEditUserSchema(t: TFunction<"users">): z.ZodType<EditUserValues, EditUserFormInput> {
  return z.object({
    email: z.email({ error: t("form.errors.email_invalid") }),
  });
}
