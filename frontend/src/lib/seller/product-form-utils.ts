import type { ProductStatus } from "@/types/api";
import {
  isProductImageMimeType,
  PRODUCT_IMAGE_MAX_BYTES,
} from "@/lib/storage/product-image-policy";

export type SellerProductFormValues = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  stockQuantity: string;
  imageUrl: string;
  status: ProductStatus;
  version?: string;
};

export function slugifyProductName(value: string) {
  const turkishCharacters: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
  };

  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (character) => turkishCharacters[character] ?? character)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function validateProductForm(
  values: SellerProductFormValues,
  options: { hasSelectedImage?: boolean } = {},
) {
  const errors: Partial<Record<keyof SellerProductFormValues, string>> = {};
  const price = Number(values.price);
  const stock = Number(values.stockQuantity);

  if (!values.name.trim() || values.name.trim().length > 160) errors.name = "name";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) errors.slug = "slug";
  if (!values.categoryId) errors.categoryId = "categoryId";
  if (!values.description.trim() || values.description.trim().length > 4_000) {
    errors.description = "description";
  }
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000) errors.price = "price";
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) {
    errors.stockQuantity = "stockQuantity";
  }
  if (!/^[A-Z]{3}$/.test(values.currency)) errors.currency = "currency";

  if (!options.hasSelectedImage) {
    try {
      const imageUrl = new URL(values.imageUrl);
      if (imageUrl.protocol !== "https:") errors.imageUrl = "imageUrl";
    } catch {
      errors.imageUrl = "imageUrl";
    }
  }

  return errors;
}

export function validateSelectedProductImage(file: File) {
  if (!isProductImageMimeType(file.type)) return "invalidImageType" as const;
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return "imageTooLarge" as const;
  return null;
}
