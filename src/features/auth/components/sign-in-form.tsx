import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { describeError } from "@/common/lib/error-report";
import { applyFieldErrors } from "@/common/lib/field-errors";
import { Alert, AlertDescription, AlertTitle } from "@/common/ui/alert";
import { Button } from "@/common/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/common/ui/field";
import { Input } from "@/common/ui/input";
import { useSignIn } from "@/features/auth/api/auth-mutations";
import { buildSignInSchema, SIGN_IN_DEFAULT_VALUES } from "@/features/auth/schemas/sign-in.schema";
import type { SignInValues } from "@/features/auth/schemas/sign-in.schema";

import type { JSX } from "react";

const SIGN_IN_FIELDS = ["email", "password"] as const;

type SignInFormProps = {
  onSignedIn: () => void;
};

export function SignInForm({ onSignedIn }: SignInFormProps): JSX.Element {
  const { t } = useTranslation("auth");
  const signIn = useSignIn();
  const emailId = useId();
  const passwordId = useId();
  // Set on submit and released when the request settles, so a double click or a held Enter sends
  // one sign-in, not one per event that arrives before the button disables.
  const isSubmitting = useRef(false);
  // What the fields cannot carry: wrong credentials, too many attempts, no connection. `unknown`,
  // because not every failure is an answer from the backend.
  const [formError, setFormError] = useState<unknown>();

  const { register, handleSubmit, setError, formState: { errors } } = useForm<SignInValues, unknown, SignInValues>({
    resolver: zodResolver(buildSignInSchema(t)),
    defaultValues: SIGN_IN_DEFAULT_VALUES,
  });

  const formErrorText = formError === undefined ? undefined : describeError(formError);

  function submit(values: SignInValues): void {
    if (isSubmitting.current) {
      return;
    }

    isSubmitting.current = true;
    setFormError(undefined);

    signIn.mutate(values, {
      onSuccess: onSignedIn,
      onError: (error: unknown): void => {
        if (!applyFieldErrors(error, setError, SIGN_IN_FIELDS)) {
          setFormError(error);
        }
      },
      onSettled: (): void => {
        isSubmitting.current = false;
      },
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
    >
      <FieldGroup>
        {formErrorText && (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>{formErrorText.title}</AlertTitle>
            <AlertDescription>{formErrorText.detail}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={errors.email !== undefined}>
          <FieldLabel htmlFor={emailId}>{t("signIn.email")}</FieldLabel>

          <Input
            id={emailId}
            type="email"
            autoComplete="username"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            {...register("email")}
          />

          <FieldError id={`${emailId}-error`} errors={[errors.email]} />
        </Field>

        <Field data-invalid={errors.password !== undefined}>
          <FieldLabel htmlFor={passwordId}>{t("signIn.password")}</FieldLabel>

          <Input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password !== undefined}
            aria-describedby={errors.password ? `${passwordId}-error` : undefined}
            {...register("password")}
          />

          <FieldError id={`${passwordId}-error`} errors={[errors.password]} />
        </Field>

        <Button type="submit" disabled={signIn.isPending}>{t("signIn.submit")}</Button>
      </FieldGroup>
    </form>
  );
}
