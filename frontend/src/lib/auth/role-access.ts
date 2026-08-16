import type { UserRole } from "@/types/api";

export function isSellerRole(role: UserRole | undefined): boolean {
  return role === "Seller";
}

export function isSellerRestrictedShoppingPath(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(tr|en)(?=\/|$)/, "") || "/";
  return (
    pathWithoutLocale === "/" ||
    pathWithoutLocale === "/cart" ||
    pathWithoutLocale === "/products" ||
    pathWithoutLocale.startsWith("/products/")
  );
}
