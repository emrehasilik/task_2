"use client";

import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuthSession } from "@/components/providers/auth-session-provider";
import { Link, useRouter } from "@/i18n/navigation";

export function AuthMenu() {
  const t = useTranslations("Nav");
  const router = useRouter();
  const { status, user } = useAuthSession();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("localcart:auth-changed"));
    router.replace("/login");
    router.refresh();
  }

  if (status === "loading") {
    return <div className="h-10 w-24 animate-pulse rounded-full bg-sage/70" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="inline-flex rounded-full px-3 py-2 text-sm font-bold text-ink transition-colors hover:text-forest"
        >
          {t("login")}
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center rounded-full bg-forest px-4 text-sm font-extrabold text-white transition-colors hover:bg-forest-dark"
        >
          {t("register")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.role === "Seller" && (
        <Link
          href="/seller"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-sage px-3 text-sm font-extrabold text-forest transition-colors hover:bg-forest hover:text-white"
        >
          <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
          {t("sellerDashboard")}
        </Link>
      )}
      <span
        className="hidden max-w-32 items-center gap-2 truncate text-sm font-bold md:inline-flex"
        title={`${user.firstName} ${user.lastName}`}
      >
        <UserRound aria-hidden="true" className="h-4 w-4 text-forest" />
        {user.firstName}
      </span>
      <button
        type="button"
        onClick={logout}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-bold transition-colors hover:border-coral hover:text-coral"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">{t("logout")}</span>
      </button>
    </div>
  );
}
