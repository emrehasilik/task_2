"use client";

import { useTranslations } from "next-intl";

import { useAuthSession } from "@/components/providers/auth-session-provider";
import { Link } from "@/i18n/navigation";
import { isSellerRole } from "@/lib/auth/role-access";

export function Footer() {
  const t = useTranslations("Footer");
  const sellerT = useTranslations("Seller");
  const { status, user } = useAuthSession();
  const seller = isSellerRole(user?.role);

  if (status === "loading") {
    return (
      <footer className="mt-auto border-t border-line bg-forest-dark text-white">
        <div className="page-shell py-14">
          <div className="display-text text-3xl">LocalCart</div>
          <div className="mt-4 h-4 w-64 max-w-full animate-pulse rounded-full bg-white/10" />
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-line bg-forest-dark text-white">
      <div
        className={`page-shell grid gap-10 py-14 ${
          seller ? "md:grid-cols-[1.4fr_1fr]" : "md:grid-cols-[1.4fr_0.7fr_0.7fr]"
        }`}
      >
        <div>
          <div className="display-text text-3xl">LocalCart</div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
            {seller ? sellerT("description") : t("tagline")}
          </p>
        </div>

        {seller ? (
          <div>
            <div className="eyebrow text-sun">{sellerT("eyebrow")}</div>
            <div className="mt-4 flex flex-col gap-3 text-sm font-bold">
              <Link href="/seller" className="hover:text-sun">{sellerT("myProducts")}</Link>
              <Link href="/seller/products/new" className="hover:text-sun">{sellerT("newProduct")}</Link>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="eyebrow text-sun">{t("discover")}</div>
              <Link href="/products" className="mt-4 block text-sm font-bold hover:text-sun">
                {t("products")}
              </Link>
            </div>
            <div>
              <div className="eyebrow text-sun">{t("account")}</div>
              <div className="mt-4 flex flex-col gap-3 text-sm font-bold">
                <Link href="/login" className="hover:text-sun">{t("login")}</Link>
                <Link href="/register" className="hover:text-sun">{t("register")}</Link>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="border-t border-white/10">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
          <span>{t("rights", { year: new Date().getFullYear() })}</span>
          <span>{t("architecture")}</span>
        </div>
      </div>
    </footer>
  );
}
