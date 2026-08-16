"use client";

import { useEffect, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import type { User } from "@/types/api";

type SellerSessionState = {
  user: User | null;
  loading: boolean;
  unavailable: boolean;
};

export function useSellerSession(): SellerSessionState {
  const router = useRouter();
  const [state, setState] = useState<SellerSessionState>({
    user: null,
    loading: true,
    unavailable: false,
  });

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!response.ok) throw new Error("Session unavailable");

        const user = (await response.json()) as User;
        if (user.role !== "Seller") {
          router.replace("/products");
          return null;
        }
        return user;
      })
      .then((user) => {
        if (active && user) {
          setState({ user, loading: false, unavailable: false });
        }
      })
      .catch(() => {
        if (active) {
          setState({ user: null, loading: false, unavailable: true });
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  return state;
}
