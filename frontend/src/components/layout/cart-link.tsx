"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useAppSelector } from "@/store/hooks";

export function CartLink() {
  const t = useTranslations("Nav");
  const count = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-bold transition-colors hover:border-forest hover:text-forest"
    >
      <ShoppingBag aria-hidden="true" className="h-4 w-4" />
      <span className="hidden sm:inline">{t("cart")}</span>
      {count > 0 && (
        <span className="grid min-w-5 place-items-center rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-black text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
