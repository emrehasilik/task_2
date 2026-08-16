import { PackageSearch } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("Product");
  const products = await getTranslations("Products");

  return (
    <div className="page-shell grid min-h-[65vh] place-items-center py-16 text-center">
      <div className="max-w-lg">
        <PackageSearch className="mx-auto h-14 w-14 text-coral" />
        <h1 className="display-text mt-6 text-5xl">{t("notFoundTitle")}</h1>
        <p className="mt-4 leading-7 text-muted">{t("notFoundDescription")}</p>
        <Link href="/products" className="mt-8 inline-flex rounded-full bg-forest px-6 py-3 text-sm font-extrabold text-white hover:bg-forest-dark">
          {products("viewProduct")}
        </Link>
      </div>
    </div>
  );
}
