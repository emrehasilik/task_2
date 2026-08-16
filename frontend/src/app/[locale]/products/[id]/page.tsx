import type { Metadata } from "next";
import { ArrowLeft, BadgeCheck, PackageCheck } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { ProductImage } from "@/components/products/product-image";
import { Link } from "@/i18n/navigation";
import { getProductById } from "@/lib/api/products";
import { clampText, formatCurrency } from "@/lib/format";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await getProductById(id);
  if (!product) return {};
  const description = clampText(product.description, 155);

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/${locale}/products/${id}`,
      languages: {
        tr: `/tr/products/${id}`,
        en: `/en/products/${id}`,
      },
    },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      images: product.imageUrl.startsWith("https://")
        ? [{ url: product.imageUrl, alt: product.name }]
        : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const product = await getProductById(id);
  if (!product) notFound();
  const t = await getTranslations("Product");
  const activeLocale = await getLocale();
  const unavailable = product.stockQuantity < 1 || product.status === "OutOfStock";

  return (
    <div className="page-shell py-10 md:py-16">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-forest">
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </Link>

      <article className="mt-7 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
        <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-line bg-sage card-shadow">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>

        <div className="flex flex-col justify-center py-3">
          <div className="eyebrow text-coral">{product.categoryName}</div>
          <h1 className="display-text mt-4 text-5xl leading-[1.02] sm:text-6xl">{product.name}</h1>
          <div className="mt-6 text-3xl font-black text-forest">
            {formatCurrency(product.price, product.currency, activeLocale)}
          </div>
          <div className={`mt-4 text-sm font-extrabold ${unavailable ? "text-coral" : "text-forest"}`}>
            {unavailable ? t("outOfStock") : t("stock", { count: product.stockQuantity })}
          </div>

          <div className="mt-7 border-y border-line py-6">
            <h2 className="text-xs font-black uppercase tracking-[0.14em] text-muted">{t("description")}</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-muted">{product.description}</p>
          </div>

          <div className="mt-7 max-w-md">
            <AddToCartButton product={product} />
          </div>
          <div className="mt-6 grid gap-3 text-sm font-bold text-muted sm:grid-cols-2">
            <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-forest" />{t("secure")}</span>
            <span className="inline-flex items-center gap-2"><PackageCheck className="h-4 w-4 text-forest" />{t("delivery")}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
