import type { ProductStatus } from "@/types/api";

export const LOW_STOCK_THRESHOLD = 5;

export function isLowStock(product: {
  status: ProductStatus;
  stockQuantity: number;
}): boolean {
  return (
    product.status !== "Archived" &&
    product.stockQuantity > 0 &&
    product.stockQuantity <= LOW_STOCK_THRESHOLD
  );
}
