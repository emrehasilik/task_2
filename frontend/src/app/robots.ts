import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/api/config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/tr/cart",
        "/en/cart",
        "/tr/login",
        "/en/login",
        "/tr/register",
        "/en/register",
        "/tr/seller",
        "/en/seller",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
