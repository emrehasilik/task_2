"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import type { User } from "@/types/api";

type Mode = "login" | "register";

const errorKeys: Record<string, string> = {
  INVALID_CREDENTIALS: "invalidCredentials",
  EMAIL_EXISTS: "emailExists",
  INVALID_REQUEST: "invalidRequest",
  RATE_LIMITED: "genericError",
  SERVICE_UNAVAILABLE: "serviceUnavailable",
};

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());

    if (mode === "register") {
      const password = String(payload.password ?? "");
      const firstName = String(payload.firstName ?? "").trim();
      const lastName = String(payload.lastName ?? "").trim();
      if (!firstName || !lastName) {
        setError("invalidRequest");
        setSubmitting(false);
        return;
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/.test(password)) {
        setError("passwordInvalid");
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json()) as { code?: string };
        setError(errorKeys[body.code ?? ""] ?? "genericError");
        return;
      }

      const user = (await response.json()) as User;
      window.dispatchEvent(new Event("localcart:auth-changed"));
      router.replace(user.role === "Seller" ? "/seller" : "/products");
      router.refresh();
    } catch {
      setError("serviceUnavailable");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {mode === "register" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("firstName")} name="firstName" autoComplete="given-name" maxLength={80} />
          <Field label={t("lastName")} name="lastName" autoComplete="family-name" maxLength={80} />
        </div>
      )}

      <Field label={t("email")} name="email" type="email" autoComplete="email" maxLength={254} />

      <label className="block">
        <span className="mb-2 block text-sm font-extrabold">{t("password")}</span>
        <span className="relative block">
          <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={mode === "register" ? 10 : undefined}
            maxLength={128}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="h-13 w-full rounded-2xl border border-line bg-paper pl-11 pr-12 text-sm outline-none transition-colors focus:border-forest"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-muted hover:text-ink"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
        {mode === "register" && <span className="mt-2 block text-xs leading-5 text-muted">{t("passwordHint")}</span>}
      </label>

      {mode === "register" && (
        <label className="block">
          <span className="mb-2 block text-sm font-extrabold">{t("role")}</span>
          <select
            name="role"
            defaultValue="Customer"
            className="h-13 w-full rounded-2xl border border-line bg-paper px-4 text-sm outline-none focus:border-forest"
          >
            <option value="Customer">{t("customer")}</option>
            <option value="Seller">{t("seller")}</option>
          </select>
        </label>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
          {t(error)}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-forest px-6 text-sm font-extrabold text-white transition-colors hover:bg-forest-dark disabled:cursor-wait disabled:opacity-65"
      >
        {submitting ? t("loading") : t(mode === "login" ? "loginAction" : "registerAction")}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </button>

      <p className="text-center text-sm text-muted">
        {t(mode === "login" ? "noAccount" : "hasAccount")} {" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-extrabold text-forest hover:underline">
          {t(mode === "login" ? "registerLink" : "loginLink")}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  maxLength: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold">{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        maxLength={maxLength}
        className="h-13 w-full rounded-2xl border border-line bg-paper px-4 text-sm outline-none transition-colors focus:border-forest"
      />
    </label>
  );
}
