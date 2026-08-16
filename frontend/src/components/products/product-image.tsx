"use client";

import { ImageOff, PackageOpen } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function ProductImage({
  src,
  alt,
  sizes,
  className = "object-cover",
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const validSource = isAllowedImageSource(src);

  if (!validSource || failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-sage to-[#f2dcc8] text-forest">
        <div className="text-center">
          {failed ? (
            <ImageOff className="mx-auto h-9 w-9 opacity-70" aria-hidden="true" />
          ) : (
            <PackageOpen className="mx-auto h-10 w-10 opacity-70" aria-hidden="true" />
          )}
          <span className="sr-only">{alt}</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function isAllowedImageSource(src: string) {
  if (src.startsWith("/")) return true;
  if (!src.startsWith("https://")) return false;

  try {
    const hostname = new URL(src).hostname.toLowerCase();
    const configuredHosts = (
      process.env.NEXT_PUBLIC_IMAGE_HOSTS ??
      "images.unsplash.com,images.pexels.com,cdn.pixabay.com"
    )
      .split(",")
      .map((host) => host.trim().toLowerCase());
    return configuredHosts.includes(hostname) || hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}
