import { describe, expect, it } from "vitest";

import { localeFromCountry } from "./locale-detection";

describe("localeFromCountry", () => {
  it("maps Türkiye to Turkish", () => {
    expect(localeFromCountry("TR")).toBe("tr");
    expect(localeFromCountry("tr")).toBe("tr");
  });

  it("uses English for other or unknown countries", () => {
    expect(localeFromCountry("DE")).toBe("en");
    expect(localeFromCountry(null)).toBe("en");
  });
});
