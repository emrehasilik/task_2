import { describe, expect, it } from "vitest";

import { isLowStock, LOW_STOCK_THRESHOLD } from "./stock-policy";

describe("seller stock policy", () => {
  it("classifies active products with one to five units as low stock", () => {
    expect(LOW_STOCK_THRESHOLD).toBe(5);
    expect(isLowStock({ status: "Published", stockQuantity: 1 })).toBe(true);
    expect(isLowStock({ status: "Draft", stockQuantity: 5 })).toBe(true);
  });

  it("keeps out-of-stock, archived and healthy inventory out of the low-stock count", () => {
    expect(isLowStock({ status: "OutOfStock", stockQuantity: 0 })).toBe(false);
    expect(isLowStock({ status: "Archived", stockQuantity: 3 })).toBe(false);
    expect(isLowStock({ status: "Published", stockQuantity: 6 })).toBe(false);
  });
});
