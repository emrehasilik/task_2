export type UserRole = "Customer" | "Seller" | "Admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  user: User;
}

export type ProductStatus = "Draft" | "Published" | "OutOfStock" | "Archived";

export type ProductSort =
  | "Newest"
  | "PriceAscending"
  | "PriceDescending"
  | "NameAscending";

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  stockQuantity: number;
  imageUrl: string;
  status: ProductStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
  version: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: ProductSort;
  page?: string;
  pageSize?: string;
}
