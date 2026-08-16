import { ArrowUpRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types/api";

import { AddToCartButton } from "./add-to-cart-button";
import { ProductImage } from "./product-image";

export async function ProductCard({ product }: { product: Product }) {
  const locale = await getLocale();
  const t = await getTranslations("Products");
  const unavailable = product.stockQuantity < 1 || product.status === "OutOfStock";

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-line bg-surface card-shadow transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-sage">
        <Link href={`/products/${product.id}`} aria-label={`${t("viewProduct")}: ${product.name}`}>
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${
            unavailable ? "bg-ink text-white" : "bg-surface/95 text-forest"
          }`}
        >
          {unavailable ? t("outOfStock") : t("inStock")}
        </span>
      </div>
      <div className="p-5">
        <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-coral">
          {product.categoryName}
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <Link href={`/products/${product.id}`} className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-extrabold leading-6 transition-colors group-hover:text-forest">
              {product.name}
            </h2>
          </Link>
          <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-forest" />
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-lg font-black text-forest">
            {formatCurrency(product.price, product.currency, locale)}
          </span>
          <AddToCartButton product={product} compact />
        </div>
      </div>
    </article>
  );
}
