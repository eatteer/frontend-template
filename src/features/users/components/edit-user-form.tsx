import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { showErrorToast } from "@/common/components/error-toast";
import { applyFieldErrors } from "@/common/lib/field-errors";
import { Button, buttonVariants } from "@/common/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/common/ui/field";
import { Input } from "@/common/ui/input";
import { Skeleton } from "@/common/ui/skeleton";
import { useUpdateUser } from "@/features/users/api/user-mutations";
import type { User } from "@/features/users/model/user";
import { buildEditUserSchema, EDIT_USER_FIELDS, toEditUserFormInput } from "@/features/users/schemas/edit-user.schema";
import type { EditUserFormInput, EditUserValues } from "@/features/users/schemas/edit-user.schema";

import type { JSX } from "react";

type EditUserFormProps = {
  // Already loaded: the form mounts with its values and is never filled in afterwards.
  user: User;
  onSaved: () => void;
};

export function EditUserForm({ user, onSaved }: EditUserFormProps): JSX.Element {
  const { t } = useTranslation("users");

  const updateUser = useUpdateUser(user.id);

  const emailId = useId();

  // Set on submit and released when the request settles, so a double click sends one request.
  const isSubmitting = useRef(false);

  const { register, handleSubmit, setError, formState: { errors, isDirty } } = useForm<EditUserFormInput, unknown, EditUserValues>({
    resolver: zodResolver(buildEditUserSchema(t)),
    defaultValues: toEditUserFormInput(user),
  });

  function submit(values: EditUserValues): void {
    if (isSubmitting.current) {
      return;
    }

    isSubmitting.current = true;

    updateUser.mutate(values, {
      onSuccess: onSaved,
      onError: (error: unknown): void => {
        if (!applyFieldErrors(error, setError, EDIT_USER_FIELDS)) {
          showErrorToast(error);
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
        <Field data-invalid={errors.email !== undefined}>
          <FieldLabel htmlFor={emailId}>{t("form.email")}</FieldLabel>

          <Input
            id={emailId}
            type="email"
            autoComplete="off"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            {...register("email")}
          />

          <FieldError id={`${emailId}-error`} errors={[errors.email]} />
        </Field>

        <div className="flex gap-2">
          {/* Nothing changed is nothing to send. */}
          <Button type="submit" disabled={!isDirty || updateUser.isPending} focusableWhenDisabled>{t("edit.submit")}</Button>

          <Link to="/users/$id" params={{ id: user.id }} className={buttonVariants({ variant: "outline" })}>
            {t("edit.cancel")}
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}

// The same field and buttons, built from the same parts, so the page keeps its height when the user
// arrives.
export function EditUserFormSkeleton(): JSX.Element {
  return (
    <FieldGroup aria-busy="true">
      <Field>
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-full" />
      </Field>

      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </FieldGroup>
  );
}
