import { SearchIcon } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedFilter } from "@/common/hooks/use-debounced-filter";
import { Field, FieldLabel } from "@/common/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/common/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/ui/select";
import { USER_STATUS_VALUES } from "@/features/users/model/user";
import type { UserStatus } from "@/features/users/model/user";
import { USER_SEARCH_MAX_LENGTH } from "@/features/users/schemas/users-search.schema";

import type { JSX } from "react";

export type UsersFilters = {
  search: string | undefined;
  status: UserStatus | undefined;
};

type UsersFiltersProps = UsersFilters & {
  onChange: (change: Partial<UsersFilters>) => void;
};

function isUserStatus(value: unknown): value is UserStatus {
  return USER_STATUS_VALUES.some((status: UserStatus): boolean => status === value);
}

export function UsersFiltersBar({ search, status, onChange }: UsersFiltersProps): JSX.Element {
  const { t } = useTranslation("users");

  const searchId = useId();
  const statusId = useId();

  const searchFilter = useDebouncedFilter(search, (value: string | undefined): void => {
    onChange({ search: value });
  });

  // The URL's "no filter" is an absent parameter; Base UI's "nothing selected" is `null`. The two
  // meet here, and nowhere else.
  const statusItems = [
    { value: null, label: t("list.all_statuses") },
    ...USER_STATUS_VALUES.map((value: UserStatus): { value: UserStatus; label: string } => ({ value, label: t(`status.${value}`) })),
  ];

  return (
    <div className="
      flex flex-col gap-3
      sm:flex-row sm:items-end
    "
    >
      <Field className="sm:max-w-xs">
        <FieldLabel htmlFor={searchId}>{t("list.search")}</FieldLabel>

        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>

          <InputGroupInput
            id={searchId}
            type="search"
            placeholder={t("list.search_placeholder")}
            maxLength={USER_SEARCH_MAX_LENGTH}
            value={searchFilter.draft}
            onChange={(event) => {
              searchFilter.change(event.target.value);
            }}
          />
        </InputGroup>
      </Field>

      <Field className="sm:max-w-48">
        <FieldLabel htmlFor={statusId}>{t("list.status")}</FieldLabel>

        <Select
          items={statusItems}
          value={status ?? null}
          onValueChange={(value: unknown) => {
            onChange({ status: isUserStatus(value) ? value : undefined });
          }}
        >
          <SelectTrigger id={statusId} className="w-full">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {statusItems.map(({ value, label }): JSX.Element => (
              <SelectItem key={value ?? "all"} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
