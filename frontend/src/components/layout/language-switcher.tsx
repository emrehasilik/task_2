"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Language");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;
    const query = searchParams.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, {
      locale: nextLocale,
    });
  }

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-line bg-surface p-1"
      aria-label={t("label")}
    >
      <Languages aria-hidden="true" className="ml-1 h-4 w-4 text-muted" />
      {(["tr", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => changeLocale(item)}
          aria-pressed={locale === item}
          className={`rounded-full px-2.5 py-1 text-xs font-extrabold transition-colors ${
            locale === item
              ? "bg-forest text-white"
              : "text-muted hover:text-ink"
          }`}
        >
          {t(item)}
        </button>
      ))}
    </div>
  );
}
