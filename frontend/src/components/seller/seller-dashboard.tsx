"use client";

import {
  AlertTriangle,
  Box,
  Clock3,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/format";
import { isLowStock } from "@/lib/seller/stock-policy";
import type { PagedResult, Product, ProductStatus } from "@/types/api";

import { ProductImage } from "../products/product-image";
import { useSellerSession } from "./use-seller-session";

const EMPTY_RESULT: PagedResult<Product> = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
};

export function SellerDashboard() {
  const t = useTranslations("Seller");
  const locale = useLocale();
  const session = useSellerSession();
  const [result, setResult] = useState(EMPTY_RESULT);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!session.user) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/seller/products?page=${page}&pageSize=20`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Products unavailable");
      setResult((await response.json()) as PagedResult<Product>);
    } catch {
      setError("loadError");
    } finally {
      setLoading(false);
    }
  }, [page, session.user]);

  useEffect(() => {
    const handle = window.setTimeout(() => void loadProducts(), 0);
    return () => window.clearTimeout(handle);
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    if (!query) return result.items;
    return result.items.filter((product) =>
      `${product.name} ${product.categoryName} ${product.slug}`
        .toLocaleLowerCase(locale)
        .includes(query),
    );
  }, [locale, result.items, search]);

  const stats = useMemo(
    () => ({
      published: result.items.filter((product) => product.status === "Published").length,
      drafts: result.items.filter((product) => product.status === "Draft").length,
      lowStock: result.items.filter(isLowStock).length,
    }),
    [result.items],
  );

  async function deleteProduct(product: Product) {
    if (!window.confirm(t("deleteConfirm", { name: product.name }))) return;
    setDeletingId(product.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/seller/products/${product.id}?version=${encodeURIComponent(product.version)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const body = (await response.json()) as { code?: string };
        setError(body.code === "CONFLICT" ? "conflictError" : "deleteError");
        return;
      }
      await loadProducts();
    } catch {
      setError("deleteError");
    } finally {
      setDeletingId(null);
    }
  }

  if (session.loading) return <DashboardSkeleton />;

  if (session.unavailable) {
    return (
      <DashboardMessage
        icon={<AlertTriangle className="h-6 w-6" />}
        title={t("sessionErrorTitle")}
        description={t("sessionErrorDescription")}
      />
    );
  }

  return (
    <div className="pb-20">
      <section className="border-b border-line bg-forest text-white">
        <div className="page-shell grid gap-8 py-12 lg:grid-cols-[1fr_auto] lg:items-end lg:py-16">
          <div>
            <div className="eyebrow text-sun">{t("eyebrow")}</div>
            <h1 className="display-text mt-3 max-w-3xl text-5xl leading-none sm:text-6xl">
              {t("title", { name: session.user?.firstName ?? "" })}
            </h1>
            <p className="mt-5 max-w-2xl leading-7 text-white/70">{t("description")}</p>
          </div>
          <Link
            href="/seller/products/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sun px-6 text-sm font-black text-ink transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("newProduct")}
          </Link>
        </div>
      </section>

      <div className="page-shell">
        <section className="-mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("summary")}>
          <StatCard icon={<Box />} label={t("totalProducts")} value={result.totalCount} />
          <StatCard icon={<PackageCheck />} label={t("publishedProducts")} value={stats.published} />
          <StatCard icon={<Clock3 />} label={t("draftProducts")} value={stats.drafts} />
          <StatCard icon={<AlertTriangle />} label={t("lowStockProducts")} value={stats.lowStock} />
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-line bg-surface card-shadow">
          <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="display-text text-3xl">{t("myProducts")}</h2>
              <p className="mt-1 text-sm text-muted">{t("myProductsDescription")}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative block flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <span className="sr-only">{t("search")}</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-11 w-full rounded-full border border-line bg-paper pl-10 pr-4 text-sm outline-none focus:border-forest"
                />
              </label>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-paper text-forest hover:border-forest"
                aria-label={t("refresh")}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="m-5 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-bold text-coral sm:m-6">
              {t(error)}
            </div>
          )}

          {loading ? (
            <ProductListSkeleton />
          ) : result.items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sage text-forest">
                <Box className="h-7 w-7" />
              </div>
              <h3 className="display-text mt-5 text-3xl">{t("emptyTitle")}</h3>
              <p className="mx-auto mt-2 max-w-md text-muted">{t("emptyDescription")}</p>
              <Link
                href="/seller/products/new"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-sm font-black text-white"
              >
                <Plus className="h-4 w-4" /> {t("addFirstProduct")}
              </Link>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="px-6 py-14 text-center text-muted">{t("searchEmpty")}</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[880px] border-collapse text-left">
                  <thead className="bg-paper text-xs uppercase tracking-[0.12em] text-muted">
                    <tr>
                      <th className="px-6 py-4 font-black">{t("product")}</th>
                      <th className="px-4 py-4 font-black">{t("status")}</th>
                      <th className="px-4 py-4 font-black">{t("stock")}</th>
                      <th className="px-4 py-4 font-black">{t("price")}</th>
                      <th className="px-4 py-4 font-black">{t("updated")}</th>
                      <th className="px-6 py-4 text-right font-black">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {visibleProducts.map((product) => (
                      <tr key={product.id} className="transition-colors hover:bg-paper/70">
                        <td className="px-6 py-4">
                          <ProductIdentity product={product} />
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={product.status} /></td>
                        <td className="px-4 py-4 text-sm font-bold">{t("stockCount", { count: product.stockQuantity })}</td>
                        <td className="px-4 py-4 font-black text-forest">{formatCurrency(product.price, product.currency, locale)}</td>
                        <td className="px-4 py-4 text-sm text-muted">{formatDate(product.updatedAtUtc, locale)}</td>
                        <td className="px-6 py-4">
                          <ProductActions product={product} deleting={deletingId === product.id} onDelete={deleteProduct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-line md:hidden">
                {visibleProducts.map((product) => (
                  <article key={product.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <ProductIdentity product={product} />
                      <StatusBadge status={product.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-paper p-3 text-sm">
                      <div><span className="block text-xs text-muted">{t("stock")}</span><b>{product.stockQuantity}</b></div>
                      <div><span className="block text-xs text-muted">{t("price")}</span><b>{formatCurrency(product.price, product.currency, locale)}</b></div>
                      <div><span className="block text-xs text-muted">{t("updated")}</span><b>{formatDate(product.updatedAtUtc, locale)}</b></div>
                    </div>
                    <div className="mt-4"><ProductActions product={product} deleting={deletingId === product.id} onDelete={deleteProduct} /></div>
                  </article>
                ))}
              </div>
            </>
          )}

          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-4 text-sm sm:px-6">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="font-extrabold text-forest disabled:opacity-35">
                {t("previous")}
              </button>
              <span className="text-muted">{t("page", { current: page, total: result.totalPages })}</span>
              <button type="button" disabled={page >= result.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="font-extrabold text-forest disabled:opacity-35">
                {t("next")}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <article className="rounded-[1.5rem] border border-line bg-surface p-5 card-shadow">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.1em] text-muted">{label}</div>
          <div className="display-text mt-2 text-4xl">{value}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sage text-forest [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      </div>
    </article>
  );
}

function ProductIdentity({ product }: { product: Product }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-sage">
        <ProductImage src={product.imageUrl} alt={product.name} sizes="48px" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-extrabold">{product.name}</div>
        <div className="mt-0.5 truncate text-xs text-muted">{product.categoryName}</div>
      </div>
    </div>
  );
}

function ProductActions({ product, deleting, onDelete }: { product: Product; deleting: boolean; onDelete: (product: Product) => void }) {
  const t = useTranslations("Seller");
  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/seller/products/${product.id}/edit`} className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-xs font-extrabold hover:border-forest hover:text-forest">
        <Pencil className="h-3.5 w-3.5" /> {t("edit")}
      </Link>
      <button type="button" disabled={deleting} onClick={() => onDelete(product)} className="inline-flex h-9 items-center gap-2 rounded-full border border-coral/30 px-3 text-xs font-extrabold text-coral hover:bg-coral/10 disabled:opacity-50">
        <Trash2 className="h-3.5 w-3.5" /> {deleting ? t("deleting") : t("delete")}
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const t = useTranslations("Seller");
  const styles: Record<ProductStatus, string> = {
    Published: "bg-sage text-forest",
    Draft: "bg-sun/25 text-ink",
    OutOfStock: "bg-coral/12 text-coral",
    Archived: "bg-ink/10 text-muted",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${styles[status]}`}>{t(`status${status}`)}</span>;
}

function DashboardSkeleton() {
  return <div className="page-shell py-16"><div className="h-44 animate-pulse rounded-[2rem] bg-sage" /><div className="mt-6 h-80 animate-pulse rounded-[2rem] bg-surface" /></div>;
}

function ProductListSkeleton() {
  return <div className="space-y-3 p-6">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-paper" />)}</div>;
}

function DashboardMessage({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="page-shell py-20"><div className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-8 text-center card-shadow"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-coral/10 text-coral">{icon}</div><h1 className="display-text mt-5 text-4xl">{title}</h1><p className="mt-3 text-muted">{description}</p></div></div>;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}
