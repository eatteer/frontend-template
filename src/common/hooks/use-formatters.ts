import { useTranslation } from "react-i18next";

import { formatDate, formatDateTime, formatMoney, formatNumber } from "@/common/lib/format";
import type { Money } from "@/common/lib/format";

type Formatters = {
  date: (isoDate: string, options?: Intl.DateTimeFormatOptions) => string;
  dateTime: (isoDate: string) => string;
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
  money: (money: Money) => string;
};

// The formatters bound to the language on screen, re-rendering the caller when it changes.
export function useFormatters(): Formatters {
  const { i18n } = useTranslation();

  const { language } = i18n;

  return {
    date: (isoDate: string, options?: Intl.DateTimeFormatOptions): string => formatDate(isoDate, language, options),
    dateTime: (isoDate: string): string => formatDateTime(isoDate, language),
    number: (value: number, options?: Intl.NumberFormatOptions): string => formatNumber(value, language, options),
    money: (money: Money): string => formatMoney(money, language),
  };
}
