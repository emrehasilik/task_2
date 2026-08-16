import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="mt-auto border-t border-line bg-forest-dark text-white">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
        <div>
          <div className="display-text text-3xl">LocalCart</div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">{t("tagline")}</p>
        </div>
        <div>
          <div className="eyebrow text-sun">{t("discover")}</div>
          <Link href="/products" className="mt-4 block text-sm font-bold hover:text-sun">
            {t("products")}
          </Link>
        </div>
        <div>
          <div className="eyebrow text-sun">{t("account")}</div>
          <div className="mt-4 flex flex-col gap-3 text-sm font-bold">
            <Link href="/login" className="hover:text-sun">{t("login")}</Link>
            <Link href="/register" className="hover:text-sun">{t("register")}</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
          <span>{t("rights", { year: new Date().getFullYear() })}</span>
          <span>{t("architecture")}</span>
        </div>
      </div>
    </footer>
  );
}
