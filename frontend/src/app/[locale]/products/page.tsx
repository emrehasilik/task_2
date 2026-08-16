import type { Metadata } from "next";
import { PackageSearch, WifiOff } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Pagination } from "@/components/products/pagination";
import { ProductFiltersPanel } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { getCategories, getProducts } from "@/lib/api/products";
import type { ProductFilters, ProductSort } from "@/types/api";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeFilters(searchParams: SearchParams): ProductFilters {
  return {
    search: first(searchParams.search),
    categoryId: first(searchParams.categoryId),
    minPrice: first(searchParams.minPrice),
    maxPrice: first(searchParams.maxPrice),
    sort: first(searchParams.sort) as ProductSort | undefined,
    page: first(searchParams.page),
    pageSize: "12",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("productsTitle"),
    description: t("productsDescription"),
    alternates: {
      canonical: `/${locale}/products`,
      languages: { tr: "/tr/products", en: "/en/products" },
    },
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Products");
  const filters = normalizeFilters(await searchParams);
  const [products, categories] = await Promise.all([
    getProducts(filters),
    getCategories(),
  ]);

  return (
    <div className="page-shell py-12 md:py-16">
      <header className="max-w-3xl">
        <div className="eyebrow text-coral">{t("eyebrow")}</div>
        <h1 className="display-text mt-3 text-5xl sm:text-6xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted">{t("description")}</p>
      </header>

      <div className="mt-10 grid items-start gap-7 lg:grid-cols-[18rem_1fr]">
        <ProductFiltersPanel
          filters={filters}
          categories={categories.data}
          categoriesAvailable={categories.available}
        />

        <section aria-live="polite">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-bold text-muted">
              {t("resultCount", { count: products.data.totalCount })}
            </p>
          </div>

          {!products.available ? (
            <div className="rounded-[2rem] border border-dashed border-line bg-surface p-10 text-center">
              <WifiOff className="mx-auto h-10 w-10 text-coral" />
              <h2 className="display-text mt-5 text-3xl">{t("unavailableTitle")}</h2>
              <p className="mt-2 text-muted">{t("unavailableDescription")}</p>
            </div>
          ) : products.data.items.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-line bg-surface p-10 text-center">
              <PackageSearch className="mx-auto h-10 w-10 text-forest" />
              <h2 className="display-text mt-5 text-3xl">{t("emptyTitle")}</h2>
              <p className="mt-2 text-muted">{t("emptyDescription")}</p>
            </div>
          ) : (
            <>
              <ProductGrid products={products.data.items} />
              <Pagination
                current={products.data.page}
                total={products.data.totalPages}
                filters={filters}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
