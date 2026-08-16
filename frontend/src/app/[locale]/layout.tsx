import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CartPersistence } from "@/components/providers/cart-persistence";
import { StoreProvider } from "@/components/providers/store-provider";
import { getSiteUrl } from "@/lib/api/config";
import { routing } from "@/i18n/routing";

import "../globals.css";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: "%s | LocalCart",
    },
    description: t("description"),
    applicationName: "LocalCart",
    alternates: {
      canonical: `/${locale}`,
      languages: {
        tr: "/tr",
        en: "/en",
      },
    },
    openGraph: {
      type: "website",
      siteName: "LocalCart",
      title: t("title"),
      description: t("description"),
      locale: locale === "tr" ? "tr_TR" : "en_US",
      images: [
        {
          url: "/og-card.png",
          width: 1200,
          height: 630,
          alt: "LocalCart — Hikâyesi olan ürünleri keşfet.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og-card.png"],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col bg-paper text-ink antialiased">
        <NextIntlClientProvider messages={messages}>
          <StoreProvider>
            <CartPersistence>
              <a
                href="#main-content"
                className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition-transform focus:translate-y-0"
              >
                {(messages.Common as { skip: string }).skip}
              </a>
              <Header />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </CartPersistence>
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
