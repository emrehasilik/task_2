"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-shell grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <AlertTriangle className="mx-auto h-12 w-12 text-coral" aria-hidden="true" />
        <h1 className="display-text mt-6 text-4xl">{t("errorTitle")}</h1>
        <p className="mt-3 leading-7 text-muted">{t("errorDescription")}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 rounded-full bg-forest px-6 py-3 text-sm font-extrabold text-white hover:bg-forest-dark"
        >
          {t("retry")}
        </button>
      </div>
    </div>
  );
}
