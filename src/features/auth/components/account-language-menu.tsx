import { LanguageMenu } from "@/common/components/language-menu";
import type { LanguageValue } from "@/common/i18n/languages";
import { useChangeAccountLanguage } from "@/features/auth/api/auth-mutations";

import type { JSX } from "react";

export function AccountLanguageMenu(): JSX.Element {
  const changeAccountLanguage = useChangeAccountLanguage();

  return (
    <LanguageMenu
      onSelect={(language: LanguageValue): void => {
        changeAccountLanguage.mutate(language);
      }}
    />
  );
}
