import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { Product } from "@/types/api";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  stockQuantity: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
}

const initialState: CartState = {
  items: [],
  hydrated: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addProduct(state, action: PayloadAction<Product>) {
      const product = action.payload;
      if (product.stockQuantity < 1) return;
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, product.stockQuantity);
        existing.stockQuantity = product.stockQuantity;
        return;
      }

      state.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
        quantity: 1,
      });
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setQuantity(
      state,
      action: PayloadAction<{ id: string; quantity: number }>,
    ) {
      const item = state.items.find((entry) => entry.id === action.payload.id);
      if (!item) return;
      item.quantity = Math.max(
        1,
        Math.min(action.payload.quantity, item.stockQuantity),
      );
    },
    clearCart(state) {
      state.items = [];
    },
    hydrateCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload.filter(
        (item) => item.quantity > 0 && item.stockQuantity > 0,
      );
      state.hydrated = true;
    },
  },
});

export const { addProduct, removeItem, setQuantity, clearCart, hydrateCart } =
  cartSlice.actions;
export const cartReducer = cartSlice.reducer;
