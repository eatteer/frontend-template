import { LanguagesIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { changeLanguage } from "@/common/i18n/i18n";
import { isLanguageValue, LANGUAGE_LABELS, LANGUAGE_VALUES } from "@/common/i18n/languages";
import type { LanguageValue } from "@/common/i18n/languages";
import { Button } from "@/common/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/common/ui/dropdown-menu";

import type { JSX } from "react";

type LanguageMenuProps = {
  // Signed in, the choice also goes to the account; without a session it stays in this browser.
  onSelect?: (language: LanguageValue) => void;
};

function applyLocally(language: LanguageValue): void {
  void changeLanguage(language);
}

export function LanguageMenu({ onSelect = applyLocally }: LanguageMenuProps): JSX.Element {
  const { t, i18n } = useTranslation();

  function selectLanguage(value: unknown): void {
    if (typeof value === "string" && isLanguageValue(value)) {
      onSelect(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t("language.label")} />}>
        <LanguagesIcon aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuRadioGroup value={i18n.language} onValueChange={selectLanguage}>
          {LANGUAGE_VALUES.map((language: LanguageValue): JSX.Element => (
            <DropdownMenuRadioItem key={language} value={language} lang={language}>
              {LANGUAGE_LABELS[language]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
