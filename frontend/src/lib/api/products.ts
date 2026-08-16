import type {
  Category,
  PagedResult,
  Product,
  ProductFilters,
  ProductSort,
} from "@/types/api";
import { cache } from "react";

import { getProductApiUrl } from "./config";

const EMPTY_PRODUCTS: PagedResult<Product> = {
  items: [],
  page: 1,
  pageSize: 12,
  totalCount: 0,
  totalPages: 0,
};

export interface ProductListResult {
  data: PagedResult<Product>;
  available: boolean;
}

const VALID_SORTS = new Set<ProductSort>([
  "Newest",
  "PriceAscending",
  "PriceDescending",
  "NameAscending",
]);

function safeInteger(value: string | undefined, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<ProductListResult> {
  const url = new URL(`${getProductApiUrl()}/api/v1/products`);
  const search = filters.search?.trim().slice(0, 100);
  if (search) url.searchParams.set("search", search);
  if (filters.categoryId) url.searchParams.set("categoryId", filters.categoryId);
  if (filters.minPrice) url.searchParams.set("minPrice", filters.minPrice);
  if (filters.maxPrice) url.searchParams.set("maxPrice", filters.maxPrice);
  if (filters.sort && VALID_SORTS.has(filters.sort)) {
    url.searchParams.set("sort", filters.sort);
  }
  url.searchParams.set("page", String(safeInteger(filters.page, 1, 10_000)));
  url.searchParams.set("pageSize", String(safeInteger(filters.pageSize, 12, 50)));

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60, tags: ["products"] },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return { data: EMPTY_PRODUCTS, available: false };
    return {
      data: (await response.json()) as PagedResult<Product>,
      available: true,
    };
  } catch {
    return { data: EMPTY_PRODUCTS, available: false };
  }
}

export async function getCategories(): Promise<{
  data: Category[];
  available: boolean;
}> {
  try {
    const response = await fetch(`${getProductApiUrl()}/api/v1/categories`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300, tags: ["categories"] },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return { data: [], available: false };
    return { data: (await response.json()) as Category[], available: true };
  } catch {
    return { data: [], available: false };
  }
}

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  try {
    const response = await fetch(`${getProductApiUrl()}/api/v1/products/${id}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60, tags: [`product-${id}`, "products"] },
      signal: AbortSignal.timeout(5_000),
    });

    if (response.status === 404) return null;
    if (!response.ok) return null;
    return (await response.json()) as Product;
  } catch {
    return null;
  }
});
