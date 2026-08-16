import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { ProductFilters } from "@/types/api";

function pageHref(filters: ProductFilters, page: number) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "page") params.set(key, value);
  });
  params.set("page", String(page));
  return `/products?${params.toString()}`;
}

export async function Pagination({
  current,
  total,
  filters,
}: {
  current: number;
  total: number;
  filters: ProductFilters;
}) {
  if (total <= 1) return null;
  const t = await getTranslations("Products");

  return (
    <nav className="mt-10 flex items-center justify-between gap-4" aria-label={t("page", { current, total })}>
      {current > 1 ? (
        <Link
          href={pageHref(filters, current - 1)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-extrabold hover:border-forest"
        >
          <ArrowLeft className="h-4 w-4" /> {t("previous")}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm font-bold text-muted">{t("page", { current, total })}</span>
      {current < total ? (
        <Link
          href={pageHref(filters, current + 1)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-extrabold hover:border-forest"
        >
          {t("next")} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
