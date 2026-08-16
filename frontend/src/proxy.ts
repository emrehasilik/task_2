import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { localeFromCountry } from "@/i18n/locale-detection";
import { routing } from "@/i18n/routing";

export default function proxy(request: NextRequest) {
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry");
  const defaultLocale = localeFromCountry(country);
  const handleI18nRouting = createMiddleware({
    ...routing,
    defaultLocale,
  });

  return handleI18nRouting(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
