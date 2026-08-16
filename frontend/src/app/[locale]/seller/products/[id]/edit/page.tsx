import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductForm } from "@/components/seller/product-form";
import { getCategories } from "@/lib/api/products";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("sellerEditTitle"), robots: { index: false, follow: false } };
}

export default async function EditProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const categories = await getCategories();
  return <ProductForm mode="edit" productId={id} categories={categories.data} />;
}
