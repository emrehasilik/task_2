import { ArrowRight, BadgeCheck, Sparkles, Store, Zap } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductGrid } from "@/components/products/product-grid";
import { Link } from "@/i18n/navigation";
import { getProducts } from "@/lib/api/products";

export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const products = await getProducts({ page: "1", pageSize: "4" });

  return (
    <>
      <section className="paper-grid overflow-hidden border-b border-line">
        <div className="page-shell relative grid min-h-[38rem] items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="relative z-10">
            <div className="eyebrow inline-flex items-center gap-2 text-coral">
              <Sparkles className="h-4 w-4" /> {t("eyebrow")}
            </div>
            <h1 className="display-text mt-5 max-w-3xl text-5xl leading-[0.98] sm:text-6xl lg:text-[5.2rem]">
              {t("titleLineOne")} <span className="text-forest">{t("titleAccent")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{t("description")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex h-13 items-center gap-2 rounded-full bg-forest px-6 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-forest-dark"
              >
                {t("explore")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-13 items-center rounded-full border border-line bg-surface px-6 text-sm font-extrabold transition-colors hover:border-forest"
              >
                {t("joinSeller")}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-muted">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-forest" />{t("trusted")}</span>
              <span className="inline-flex items-center gap-2"><Store className="h-4 w-4 text-forest" />{t("curated")}</span>
              <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-forest" />{t("fast")}</span>
            </div>
          </div>

          <div className="relative mx-auto hidden h-[29rem] w-full max-w-md lg:block" aria-hidden="true">
            <div className="absolute inset-5 rotate-3 rounded-[3rem] bg-sun" />
            <div className="absolute inset-0 -rotate-3 overflow-hidden rounded-[3rem] border border-forest/20 bg-forest p-8 text-white card-shadow">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.14em] text-white/65">
                <span>{t("cardEdition")}</span><span>2026</span>
              </div>
              <div className="mt-14 h-44 rounded-[2rem] bg-sage p-5 text-forest">
                <div className="grid h-full place-items-center rounded-[1.5rem] border border-forest/20">
                  <Store className="h-20 w-20 stroke-[1.2]" />
                </div>
              </div>
              <div className="display-text mt-8 text-4xl leading-none">{t("cardTitle")}</div>
            </div>
            <div className="absolute -right-8 bottom-10 grid h-24 w-24 rotate-12 place-items-center rounded-full border-4 border-paper bg-coral text-center text-xs font-black uppercase tracking-wider text-white">
              {t("cardBadge")}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-16 md:py-24">
        <div className="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow text-coral">{t("featuredEyebrow")}</div>
            <h2 className="display-text mt-3 text-4xl sm:text-5xl">{t("featuredTitle")}</h2>
            <p className="mt-3 text-muted">{t("featuredDescription")}</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-extrabold text-forest">
            {t("viewAll")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {products.available && products.data.items.length > 0 ? (
          <ProductGrid products={products.data.items} />
        ) : (
          <div className="rounded-[2rem] border border-dashed border-line bg-surface p-10 text-center">
            <Store className="mx-auto h-10 w-10 text-forest" />
            <h3 className="display-text mt-5 text-3xl">
              {products.available ? t("emptyTitle") : t("serviceTitle")}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-muted">
              {products.available ? t("emptyDescription") : t("serviceDescription")}
            </p>
          </div>
        )}
      </section>

      <section className="bg-sage/70 py-16 md:py-24">
        <div className="page-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="eyebrow text-coral">{t("storyEyebrow")}</div>
          <div>
            <h2 className="display-text text-4xl leading-tight sm:text-5xl">{t("storyTitle")}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{t("storyDescription")}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["storyStatOne", "storyStatTwo", "storyStatThree"].map((key, index) => (
                <div key={key} className="rounded-2xl border border-forest/10 bg-surface/70 p-4">
                  <div className="text-xs font-black text-coral">0{index + 1}</div>
                  <div className="mt-2 text-sm font-extrabold">{t(key)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
