"use client";

import { useEffect, type ReactNode } from "react";

import { useAuthSession } from "@/components/providers/auth-session-provider";
import { isSellerRole } from "@/lib/auth/role-access";
import { clearCart, hydrateCart } from "@/store/features/cart/cart-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const STORAGE_KEY = "localcart.cart.v1";

export function CartPersistence({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { items, hydrated } = useAppSelector((state) => state.cart);
  const { user } = useAuthSession();
  const seller = isSellerRole(user?.role);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      dispatch(hydrateCart(saved ? JSON.parse(saved) : []));
    } catch {
      dispatch(hydrateCart([]));
    }
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) return;
    if (seller) {
      if (items.length > 0) dispatch(clearCart());
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [dispatch, hydrated, items, seller]);

  return children;
}
