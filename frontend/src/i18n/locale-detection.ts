import type { AppLocale } from "./routing";

const TURKISH_COUNTRY_CODES = new Set(["TR"]);

export function localeFromCountry(countryCode: string | null): AppLocale {
  if (countryCode && TURKISH_COUNTRY_CODES.has(countryCode.toUpperCase())) {
    return "tr";
  }

  return "en";
}
