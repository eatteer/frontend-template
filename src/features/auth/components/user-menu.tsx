import { CircleUserIcon, LogOutIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/common/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/ui/dropdown-menu";
import { useSignOut } from "@/features/auth/api/auth-mutations";
import { useSessionUser } from "@/features/auth/api/use-session";

import type { JSX } from "react";

export function UserMenu(): JSX.Element | null {
  const { t } = useTranslation("auth");
  const user = useSessionUser();
  const signOut = useSignOut();

  if (user === undefined) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t("userMenu.label")} />}>
        <CircleUserIcon aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-auto min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="font-medium text-foreground">{user.name}</span>
            <span className="font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            signOut.mutate();
          }}
        >
          <LogOutIcon aria-hidden="true" />
          {t("userMenu.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
