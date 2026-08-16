import { describe, expect, it } from "vitest";

import type { Product } from "@/types/api";

import { addProduct, cartReducer, setQuantity } from "./cart-slice";

const product: Product = {
  id: "868a356b-6e8e-4aa6-aa70-34f2d20ae2a0",
  sellerId: "b76620ef-82c4-4607-b38f-b13e8944b814",
  categoryId: "75d16250-da4f-4bbb-9717-078704107f68",
  categoryName: "Home",
  name: "Handmade cup",
  slug: "handmade-cup",
  description: "A handmade ceramic cup.",
  price: 420,
  currency: "TRY",
  stockQuantity: 2,
  imageUrl: "https://example.com/cup.jpg",
  status: "Published",
  createdAtUtc: "2026-08-13T00:00:00Z",
  updatedAtUtc: "2026-08-13T00:00:00Z",
  version: "08d15a83-4675-44f4-b3ad-a44f5d037616",
};

describe("cartReducer", () => {
  it("adds a product and caps quantity at current stock", () => {
    let state = cartReducer(undefined, addProduct(product));
    state = cartReducer(state, addProduct(product));
    state = cartReducer(state, addProduct(product));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("does not add an unavailable product", () => {
    const state = cartReducer(
      undefined,
      addProduct({ ...product, stockQuantity: 0, status: "OutOfStock" }),
    );

    expect(state.items).toHaveLength(0);
  });

  it("keeps manually selected quantities within valid bounds", () => {
    let state = cartReducer(undefined, addProduct(product));
    state = cartReducer(state, setQuantity({ id: product.id, quantity: 99 }));
    expect(state.items[0].quantity).toBe(2);

    state = cartReducer(state, setQuantity({ id: product.id, quantity: 0 }));
    expect(state.items[0].quantity).toBe(1);
  });
});
