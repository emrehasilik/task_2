import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SellerDashboard } from "@/components/seller/seller-dashboard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("sellerTitle"), robots: { index: false, follow: false } };
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SellerDashboard />;
}
