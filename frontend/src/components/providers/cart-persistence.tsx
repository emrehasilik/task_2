"use client";

import { useEffect, type ReactNode } from "react";

import { hydrateCart } from "@/store/features/cart/cart-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const STORAGE_KEY = "localcart.cart.v1";

export function CartPersistence({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { items, hydrated } = useAppSelector((state) => state.cart);

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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  return children;
}
