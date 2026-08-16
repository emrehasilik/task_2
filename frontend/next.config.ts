import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const imageHosts = (
  process.env.NEXT_PUBLIC_IMAGE_HOSTS ??
  "images.unsplash.com,images.pexels.com,cdn.pixabay.com"
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...imageHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
