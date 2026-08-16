import { describe, expect, it } from "vitest";

import {
  hasValidProductImageSignature,
  isProductImageMimeType,
  PRODUCT_IMAGE_MAX_BYTES,
  productImageExtension,
} from "./product-image-policy";

describe("product image policy", () => {
  it("accepts only the supported image MIME types", () => {
    expect(isProductImageMimeType("image/jpeg")).toBe(true);
    expect(isProductImageMimeType("image/png")).toBe(true);
    expect(isProductImageMimeType("image/webp")).toBe(true);
    expect(isProductImageMimeType("image/svg+xml")).toBe(false);
  });

  it("maps supported types to stable extensions", () => {
    expect(productImageExtension("image/jpeg")).toBe("jpg");
    expect(productImageExtension("image/png")).toBe("png");
    expect(productImageExtension("image/webp")).toBe("webp");
    expect(PRODUCT_IMAGE_MAX_BYTES).toBe(5_242_880);
  });

  it("checks file signatures instead of trusting the browser MIME type", () => {
    expect(
      hasValidProductImageSignature("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xdb])),
    ).toBe(true);
    expect(
      hasValidProductImageSignature(
        "image/png",
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe(true);
    expect(
      hasValidProductImageSignature(
        "image/webp",
        new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4, 87, 69, 66, 80]),
      ),
    ).toBe(true);
    expect(
      hasValidProductImageSignature("image/png", new Uint8Array([0xff, 0xd8, 0xff, 0xdb])),
    ).toBe(false);
  });
});
