"use client";

import { useEffect } from "react";

import { useAuthSession } from "@/components/providers/auth-session-provider";
import { useRouter } from "@/i18n/navigation";
import type { User } from "@/types/api";

type SellerSessionState = {
  user: User | null;
  loading: boolean;
  unavailable: boolean;
};

export function useSellerSession(): SellerSessionState {
  const router = useRouter();
  const { status, user } = useAuthSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && user?.role !== "Seller") router.replace("/products");
  }, [router, status, user]);

  const sellerUser = user?.role === "Seller" ? user : null;
  return {
    user: sellerUser,
    loading:
      status === "loading" ||
      status === "unauthenticated" ||
      (status === "authenticated" && !sellerUser),
    unavailable: status === "unavailable",
  };
}
