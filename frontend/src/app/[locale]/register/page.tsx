import type { Metadata } from "next";
import { Store } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthForm } from "@/components/auth/auth-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("registerTitle"), robots: { index: false, follow: true } };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <div className="page-shell grid min-h-[48rem] items-center py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <div className="hidden rounded-[3rem] bg-coral p-10 text-white lg:block">
        <Store className="h-12 w-12 text-sun" />
        <div className="display-text mt-24 text-5xl leading-tight">{t("registerVisualTitle")}</div>
        <p className="mt-5 max-w-md leading-7 text-white/75">{t("registerVisualDescription")}</p>
      </div>
      <div className="mx-auto w-full max-w-xl">
        <div className="eyebrow text-coral">{t("registerEyebrow")}</div>
        <h1 className="display-text mt-3 text-5xl">{t("registerTitle")}</h1>
        <p className="mt-4 leading-7 text-muted">{t("registerDescription")}</p>
        <div className="mt-8 rounded-[2rem] border border-line bg-surface p-6 card-shadow sm:p-8">
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
