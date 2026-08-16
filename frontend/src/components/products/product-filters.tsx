import { Search, SlidersHorizontal } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Category, ProductFilters, ProductSort } from "@/types/api";

const SORT_OPTIONS: ProductSort[] = [
  "Newest",
  "PriceAscending",
  "PriceDescending",
  "NameAscending",
];

export async function ProductFiltersPanel({
  filters,
  categories,
  categoriesAvailable,
}: {
  filters: ProductFilters;
  categories: Category[];
  categoriesAvailable: boolean;
}) {
  const t = await getTranslations("Products");
  const sortLabels: Record<ProductSort, string> = {
    Newest: t("sortNewest"),
    PriceAscending: t("sortPriceAsc"),
    PriceDescending: t("sortPriceDesc"),
    NameAscending: t("sortName"),
  };

  return (
    <aside className="rounded-[1.75rem] border border-line bg-surface p-5 card-shadow lg:sticky lg:top-24">
      <div className="flex items-center gap-2 border-b border-line pb-4 font-extrabold">
        <SlidersHorizontal className="h-5 w-5 text-forest" aria-hidden="true" />
        {t("apply")}
      </div>
      <form method="get" className="mt-5 space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-muted">
            {t("search")}
          </span>
          <span className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="search"
              type="search"
              defaultValue={filters.search}
              maxLength={100}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-line bg-paper pl-10 pr-3 text-sm outline-none transition-colors focus:border-forest"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-muted">
            {t("category")}
          </span>
          <select
            name="categoryId"
            defaultValue={filters.categoryId ?? ""}
            disabled={!categoriesAvailable}
            className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-forest disabled:opacity-60"
          >
            <option value="">
              {categoriesAvailable ? t("allCategories") : t("categoryUnavailable")}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-muted">
              {t("minPrice")}
            </span>
            <input
              name="minPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={filters.minPrice}
              className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-forest"
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-muted">
              {t("maxPrice")}
            </span>
            <input
              name="maxPrice"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={filters.maxPrice}
              className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-forest"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-muted">
            {t("sort")}
          </span>
          <select
            name="sort"
            defaultValue={filters.sort ?? "Newest"}
            className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-forest"
          >
            {SORT_OPTIONS.map((sort) => (
              <option key={sort} value={sort}>
                {sortLabels[sort]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="h-11 w-full rounded-full bg-forest px-4 text-sm font-extrabold text-white transition-colors hover:bg-forest-dark"
        >
          {t("apply")}
        </button>
        <Link
          href="/products"
          className="block text-center text-sm font-bold text-muted transition-colors hover:text-coral"
        >
          {t("clear")}
        </Link>
      </form>
    </aside>
  );
}
