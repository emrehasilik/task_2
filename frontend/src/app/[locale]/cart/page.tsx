import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CartView } from "@/components/cart/cart-view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("cartTitle"), robots: { index: false, follow: true } };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cart");

  return (
    <div className="page-shell py-12 md:py-16">
      <div className="eyebrow text-coral">{t("eyebrow")}</div>
      <h1 className="display-text mt-3 text-5xl sm:text-6xl">{t("title")}</h1>
      <div className="mt-9"><CartView /></div>
    </div>
  );
}
