import { LanguageMenu } from "@/common/components/language-menu";
import { useChangeAccountLanguage } from "@/features/auth/api/auth-mutations";

import type { JSX } from "react";

export function AccountLanguageMenu(): JSX.Element {
  const changeAccountLanguage = useChangeAccountLanguage();

  return (
    <LanguageMenu
      onSelect={(language) => {
        changeAccountLanguage.mutate(language);
      }}
    />
  );
}
