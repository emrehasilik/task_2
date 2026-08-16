import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/api/config";
import { getProducts } from "@/lib/api/products";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const products = await getProducts({ page: "1", pageSize: "50" });
  const staticRoutes = ["", "/products"];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${siteUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route ? "hourly" : "daily",
        priority: route ? 0.9 : 1,
        alternates: {
          languages: {
            tr: `${siteUrl}/tr${route}`,
            en: `${siteUrl}/en${route}`,
          },
        },
      });
    }
  }

  if (products.available) {
    for (const product of products.data.items) {
      for (const locale of routing.locales) {
        entries.push({
          url: `${siteUrl}/${locale}/products/${product.id}`,
          lastModified: new Date(product.updatedAtUtc),
          changeFrequency: "daily",
          priority: 0.8,
          alternates: {
            languages: {
              tr: `${siteUrl}/tr/products/${product.id}`,
              en: `${siteUrl}/en/products/${product.id}`,
            },
          },
        });
      }
    }
  }

  return entries;
}
