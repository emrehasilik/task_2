import { describe, expect, it } from "vitest";

import {
  slugifyProductName,
  validateProductForm,
  validateSelectedProductImage,
} from "./product-form-utils";

describe("seller product form utilities", () => {
  it("creates a URL-safe slug from Turkish product names", () => {
    expect(slugifyProductName("  Şık Öğütücü & Çay Seti  ")).toBe(
      "sik-ogutucu-cay-seti",
    );
  });

  it("accepts a complete product form", () => {
    expect(
      validateProductForm({
        categoryId: "10000000-0000-0000-0000-000000000001",
        name: "El yapımı seramik kupa",
        slug: "el-yapimi-seramik-kupa",
        description: "Yerel çamurdan elde şekillendirilmiş, sırlı seramik kupa.",
        price: "425.50",
        currency: "TRY",
        stockQuantity: "12",
        imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d",
        status: "Published",
      }),
    ).toEqual({});
  });

  it("rejects invalid price, stock, slug and image values", () => {
    const errors = validateProductForm({
      categoryId: "",
      name: "",
      slug: "Geçersiz slug",
      description: "",
      price: "0",
      currency: "TL",
      stockQuantity: "1.5",
      imageUrl: "http://example.com/product.jpg",
      status: "Draft",
    });

    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining([
        "categoryId",
        "name",
        "slug",
        "description",
        "price",
        "currency",
        "stockQuantity",
        "imageUrl",
      ]),
    );
  });

  it("allows a device image to replace an empty URL", () => {
    const errors = validateProductForm(
      {
        categoryId: "10000000-0000-0000-0000-000000000001",
        name: "Ahşap oyuncak",
        slug: "ahsap-oyuncak",
        description: "El işçiliğiyle üretilen doğal ahşap oyuncak.",
        price: "250",
        currency: "TRY",
        stockQuantity: "5",
        imageUrl: "",
        status: "Draft",
      },
      { hasSelectedImage: true },
    );

    expect(errors.imageUrl).toBeUndefined();
  });

  it("validates selected image type and size before upload", () => {
    expect(
      validateSelectedProductImage(new File(["x"], "product.svg", { type: "image/svg+xml" })),
    ).toBe("invalidImageType");
    expect(
      validateSelectedProductImage(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "product.jpg", {
          type: "image/jpeg",
        }),
      ),
    ).toBe("imageTooLarge");
  });
});
