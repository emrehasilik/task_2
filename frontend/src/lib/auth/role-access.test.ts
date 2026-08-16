import { describe, expect, it } from "vitest";

import { isSellerRestrictedShoppingPath, isSellerRole } from "./role-access";

describe("role access rules", () => {
  it("recognizes only Seller as the seller role", () => {
    expect(isSellerRole("Seller")).toBe(true);
    expect(isSellerRole("Customer")).toBe(false);
    expect(isSellerRole("Admin")).toBe(false);
    expect(isSellerRole(undefined)).toBe(false);
  });

  it.each(["/", "/products", "/products/product-id", "/cart", "/tr/products", "/en/cart"])(
    "keeps sellers out of shopping route %s",
    (pathname) => {
      expect(isSellerRestrictedShoppingPath(pathname)).toBe(true);
    },
  );

  it.each(["/seller", "/seller/products/new", "/tr/seller", "/login"])(
    "allows seller workspace route %s",
    (pathname) => {
      expect(isSellerRestrictedShoppingPath(pathname)).toBe(false);
    },
  );
});
