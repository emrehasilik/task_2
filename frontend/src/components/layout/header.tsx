"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";

import { Link } from "@/i18n/navigation";

import { AuthMenu } from "./auth-menu";
import { CartLink } from "./cart-link";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/90 backdrop-blur-xl">
      <div className="page-shell flex h-18 items-center justify-between gap-4">
        <Link href="/" className="group inline-flex items-center gap-2" aria-label={t("home")}>
          <span className="grid h-9 w-9 rotate-[-4deg] place-items-center rounded-xl bg-forest font-black text-white transition-transform group-hover:rotate-0">
            L
          </span>
          <span className="display-text text-xl">LocalCart</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          <Link
            href="/products"
            className="text-sm font-extrabold text-muted transition-colors hover:text-forest"
          >
            {t("products")}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Suspense fallback={<div className="h-10 w-28 animate-pulse rounded-full bg-sage/70" />}>
            <LanguageSwitcher />
          </Suspense>
          <CartLink />
          <AuthMenu />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <CartLink />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface"
            aria-expanded={open}
            aria-label={t("menu")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-surface lg:hidden">
          <div className="page-shell flex flex-col gap-4 py-5">
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="text-base font-extrabold"
            >
              {t("products")}
            </Link>
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Suspense fallback={<div className="h-10 w-28 animate-pulse rounded-full bg-sage/70" />}>
                <LanguageSwitcher />
              </Suspense>
              <AuthMenu />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
