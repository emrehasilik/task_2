"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ProductImage } from "@/components/products/product-image";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/format";
import { clearCart, removeItem, setQuantity } from "@/store/features/cart/cart-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function CartView() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const dispatch = useAppDispatch();
  const { items, hydrated } = useAppSelector((state) => state.cart);

  if (!hydrated) {
    return <div className="h-56 animate-pulse rounded-[2rem] bg-sage/60" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[2.5rem] border border-dashed border-line bg-surface p-10 text-center sm:p-16">
        <ShoppingBag className="mx-auto h-12 w-12 text-forest" />
        <h2 className="display-text mt-5 text-4xl">{t("emptyTitle")}</h2>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-muted">{t("emptyDescription")}</p>
        <Link href="/products" className="mt-7 inline-flex rounded-full bg-forest px-6 py-3 text-sm font-extrabold text-white hover:bg-forest-dark">
          {t("explore")}
        </Link>
      </div>
    );
  }

  const totals = items.reduce<Record<string, number>>((result, item) => {
    result[item.currency] = (result[item.currency] ?? 0) + item.price * item.quantity;
    return result;
  }, {});
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_23rem]">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted">{t("itemCount", { count: itemCount })}</span>
          <button type="button" onClick={() => dispatch(clearCart())} className="text-sm font-extrabold text-coral hover:underline">
            {t("clear")}
          </button>
        </div>

        {items.map((item) => (
          <article key={item.id} className="grid grid-cols-[6.5rem_1fr] gap-4 rounded-[1.75rem] border border-line bg-surface p-4 card-shadow sm:grid-cols-[8rem_1fr]">
            <Link href={`/products/${item.id}`} className="relative aspect-square overflow-hidden rounded-2xl bg-sage">
              <ProductImage src={item.imageUrl} alt={item.name} sizes="128px" />
            </Link>
            <div className="flex min-w-0 flex-col justify-between gap-4 py-1 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <Link href={`/products/${item.id}`} className="line-clamp-2 text-base font-extrabold hover:text-forest sm:text-lg">
                  {item.name}
                </Link>
                <div className="mt-2 font-black text-forest">{formatCurrency(item.price, item.currency, locale)}</div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <div className="inline-flex items-center rounded-full border border-line bg-paper p-1" aria-label={t("quantity")}>
                  <button
                    type="button"
                    onClick={() => dispatch(setQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                    className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface"
                    aria-label={`${t("quantity")} -`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-black">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => dispatch(setQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                    disabled={item.quantity >= item.stockQuantity}
                    className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface disabled:opacity-30"
                    aria-label={`${t("quantity")} +`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(removeItem(item.id))}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-muted hover:text-coral"
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t("remove")}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="rounded-[2rem] bg-forest-dark p-6 text-white card-shadow lg:sticky lg:top-24">
        <h2 className="display-text text-3xl">{t("summary")}</h2>
        <div className="mt-6 space-y-4 border-y border-white/15 py-5 text-sm">
          <div className="flex justify-between gap-4 text-white/70">
            <span>{t("subtotal")}</span>
            <span className="text-right font-extrabold text-white">
              {Object.entries(totals).map(([currency, value]) => (
                <span key={currency} className="block">{formatCurrency(value, currency, locale)}</span>
              ))}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-white/70">
            <span>{t("shipping")}</span><span className="text-right text-xs">{t("shippingNote")}</span>
          </div>
        </div>
        <div className="mt-5 flex justify-between gap-4">
          <span className="font-extrabold">{t("total")}</span>
          <span className="text-right text-xl font-black text-sun">
            {Object.entries(totals).map(([currency, value]) => (
              <span key={currency} className="block">{formatCurrency(value, currency, locale)}</span>
            ))}
          </span>
        </div>
        <button type="button" disabled className="mt-6 h-13 w-full cursor-not-allowed rounded-full bg-white/20 px-5 text-sm font-extrabold text-white/65">
          {t("checkout")}
        </button>
        <p className="mt-3 text-center text-xs leading-5 text-white/50">{t("checkoutNotice")}</p>
      </aside>
    </div>
  );
}
