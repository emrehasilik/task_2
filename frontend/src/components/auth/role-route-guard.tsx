"use client";

import { PackageOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";

import { useAuthSession } from "@/components/providers/auth-session-provider";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isSellerRestrictedShoppingPath, isSellerRole } from "@/lib/auth/role-access";

export function RoleRouteGuard({ children }: { children: ReactNode }) {
  const t = useTranslations("Common");
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useAuthSession();
  const shoppingRoute = isSellerRestrictedShoppingPath(pathname);
  const sellerOnShoppingRoute = shoppingRoute && isSellerRole(user?.role);

  useEffect(() => {
    if (status === "authenticated" && sellerOnShoppingRoute) {
      router.replace("/seller");
    }
  }, [router, sellerOnShoppingRoute, status]);

  if (shoppingRoute && (status === "loading" || sellerOnShoppingRoute)) {
    return (
      <div className="page-shell py-20" aria-busy="true">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[2rem] border border-line bg-surface p-10 text-center card-shadow">
          <PackageOpen className="h-10 w-10 animate-pulse text-forest" />
          <span className="mt-4 text-sm font-extrabold text-muted">{t("loading")}</span>
        </div>
      </div>
    );
  }

  return children;
}
