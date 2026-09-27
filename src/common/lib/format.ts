import { useTranslation } from "react-i18next";

// The wire shape of an amount: minor units as a string, so no amount ever passes through a float.
export type Money = {
  amountMinor: string;
  currency: string;
};

const DECIMAL_SEPARATOR = ".";
const NEGATIVE_SIGN = "-";

// Dates arrive as ISO 8601 in UTC and are shown in the reader's time zone.
export function formatDate(isoDate: string, language: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  return new Intl.DateTimeFormat(language, options).format(new Date(isoDate));
}

export function formatDateTime(isoDate: string, language: string): string {
  return formatDate(isoDate, language, { dateStyle: "medium", timeStyle: "short" });
}

export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(language, options).format(value);
}

function isNumericLiteral(value: string): value is Intl.StringNumericLiteral {
  return value.trim() !== "" && !Number.isNaN(Number(value));
}

// The currency decides where the decimal point goes (JPY has none, KWD has three), so the minor
// units become an exact decimal string — Intl formats strings without rounding them through a float.
export function formatMoney({ amountMinor, currency }: Money, language: string): string {
  const formatter = new Intl.NumberFormat(language, { style: "currency", currency });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 0;
  const sign = amountMinor.startsWith(NEGATIVE_SIGN) ? NEGATIVE_SIGN : "";
  const digits = amountMinor.slice(sign.length).padStart(fractionDigits + 1, "0");
  const pointAt = digits.length - fractionDigits;

  const decimal = fractionDigits > 0
    ? `${sign}${digits.slice(0, pointAt)}${DECIMAL_SEPARATOR}${digits.slice(pointAt)}`
    : `${sign}${digits}`;

  if (!isNumericLiteral(decimal)) {
    throw new Error(`Not an amount in minor units: "${amountMinor}"`);
  }

  return formatter.format(decimal);
}

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
