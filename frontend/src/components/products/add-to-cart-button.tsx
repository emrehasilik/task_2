"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
  const unavailable = product.stockQuantity < 1 || product.status === "OutOfStock";

  function add() {
    dispatch(addProduct(product));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={unavailable}
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
