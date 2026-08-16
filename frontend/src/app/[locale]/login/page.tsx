import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthForm } from "@/components/auth/auth-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("loginTitle"), robots: { index: false, follow: true } };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <div className="page-shell grid min-h-[44rem] items-center py-12 lg:grid-cols-2 lg:gap-16">
      <div className="hidden rounded-[3rem] bg-forest-dark p-10 text-white lg:block">
        <ShieldCheck className="h-12 w-12 text-sun" />
        <div className="display-text mt-24 text-5xl leading-tight">{t("loginVisualTitle")}</div>
        <p className="mt-5 max-w-md leading-7 text-white/65">{t("loginVisualDescription")}</p>
      </div>
      <div className="mx-auto w-full max-w-md">
        <div className="eyebrow text-coral">{t("loginEyebrow")}</div>
        <h1 className="display-text mt-3 text-5xl">{t("loginTitle")}</h1>
        <p className="mt-4 leading-7 text-muted">{t("loginDescription")}</p>
        <div className="mt-8 rounded-[2rem] border border-line bg-surface p-6 card-shadow sm:p-8">
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  );
}
