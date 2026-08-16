"use client";

import { Check, LayoutDashboard, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAuthSession } from "@/components/providers/auth-session-provider";
import { Link } from "@/i18n/navigation";
import { isSellerRole } from "@/lib/auth/role-access";
import { addProduct } from "@/store/features/cart/cart-slice";
import { useAppDispatch } from "@/store/hooks";
import type { Product } from "@/types/api";

export function AddToCartButton({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const t = useTranslations("Product");
  const dispatch = useAppDispatch();
  const [added, setAdded] = useState(false);
  const { status, user } = useAuthSession();
  const seller = isSellerRole(user?.role);
  const unavailable = product.stockQuantity < 1 || product.status === "OutOfStock";

  function add() {
    if (seller || (status !== "authenticated" && status !== "unauthenticated")) return;
    dispatch(addProduct(product));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  if (seller) {
    if (compact) return null;
    return (
      <div className="rounded-2xl border border-forest/20 bg-sage/60 p-4 text-sm font-bold text-forest">
        <p>{t("sellerCartDisabled")}</p>
        <Link href="/seller" className="mt-3 inline-flex items-center gap-2 font-extrabold underline underline-offset-4">
          <LayoutDashboard className="h-4 w-4" /> {t("sellerDashboardLink")}
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={unavailable || status === "loading" || status === "unavailable"}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition-all disabled:cursor-not-allowed disabled:bg-line disabled:text-muted ${
        compact
          ? "h-10 w-10 bg-forest text-white hover:bg-forest-dark"
          : "h-13 w-full bg-forest px-6 text-sm text-white hover:-translate-y-0.5 hover:bg-forest-dark"
      }`}
      aria-label={added ? t("added") : t("addToCart")}
    >
      {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
      {!compact && (added ? t("added") : t("addToCart"))}
    </button>
  );
}
