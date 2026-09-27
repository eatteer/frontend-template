import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { isTheme, THEME_VALUES } from "@/common/components/theme/theme";
import type { Theme } from "@/common/components/theme/theme";
import { useTheme } from "@/common/components/theme/theme-context";
import { Button } from "@/common/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/common/ui/dropdown-menu";

import type { JSX } from "react";

const THEME_ICONS: Record<Theme, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

const HALF = 2;

export function ThemeMenu(): JSX.Element {
  const { t } = useTranslation();

  const { theme, resolvedTheme, setTheme } = useTheme();

  const triggerRef = useRef<HTMLButtonElement>(null);

  const TriggerIcon = resolvedTheme === "dark" ? MoonIcon : SunIcon;

  // The reveal grows out of the button that opened the menu, wherever the reader clicked.
  function changeTheme(value: unknown): void {
    if (typeof value !== "string" || !isTheme(value)) {
      return;
    }

    const trigger = triggerRef.current?.getBoundingClientRect();

    setTheme(
      value,
      trigger && { x: trigger.left + trigger.width / HALF, y: trigger.top + trigger.height / HALF },
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        ref={triggerRef}
        render={<Button variant="ghost" size="icon" aria-label={t("theme.label")} />}
      >
        <TriggerIcon aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuRadioGroup value={theme} onValueChange={changeTheme}>
          {THEME_VALUES.map((value: Theme): JSX.Element => {
            const Icon = THEME_ICONS[value];

            return (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon aria-hidden="true" />
                {t(`theme.${value}`)}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
