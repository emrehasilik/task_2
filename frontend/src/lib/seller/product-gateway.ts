import "server-only";

import { NextResponse } from "next/server";

import { getProductApiUrl } from "@/lib/api/config";
import type { Product, ProductStatus } from "@/types/api";

export type ProductPayload = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  stockQuantity: number;
  imageUrl: string;
  status: ProductStatus;
  version?: string;
};

type BackendProblem = {
  detail?: string;
  errors?: Record<string, string[]>;
};

const PRODUCT_STATUSES = new Set<ProductStatus>([
  "Draft",
  "Published",
  "OutOfStock",
  "Archived",
]);

export function parseProductPayload(value: unknown): ProductPayload | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const price = Number(body.price);
  const stockQuantity = Number(body.stockQuantity);
  const status = body.status as ProductStatus;

  if (
    typeof body.categoryId !== "string" ||
    typeof body.name !== "string" ||
    typeof body.slug !== "string" ||
    typeof body.description !== "string" ||
    typeof body.currency !== "string" ||
    !Number.isFinite(price) ||
    !Number.isInteger(stockQuantity) ||
    !PRODUCT_STATUSES.has(status)
  ) {
    return null;
  }

  return {
    categoryId: body.categoryId.trim(),
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    description: body.description.trim(),
    price,
    currency: body.currency.trim().toUpperCase(),
    stockQuantity,
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
    status,
    version: typeof body.version === "string" ? body.version : undefined,
  };
}

export async function parseProductMutationRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const rawPayload = formData.get("payload");
    if (typeof rawPayload !== "string") return null;

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(rawPayload);
    } catch {
      return null;
    }

    const imageEntry = formData.get("image");
    return {
      image: imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null,
      payload: parseProductPayload(parsedPayload),
    };
  }

  try {
    return { image: null, payload: parseProductPayload(await request.json()) };
  } catch {
    return null;
  }
}

export async function getOwnedProduct(
  accessToken: string,
  id: string,
  sellerId: string,
): Promise<
  | { ok: true; product: Product }
  | { ok: false; response?: Response; code?: "NOT_FOUND" }
> {
  const response = await productApiFetch(
    accessToken,
    `/api/v1/products/${encodeURIComponent(id)}`,
  );
  if (!response.ok) return { ok: false, response };

  const product = (await response.json()) as Product;
  return product.sellerId === sellerId
    ? { ok: true, product }
    : { ok: false, code: "NOT_FOUND" };
}

export async function productApiFetch(
  accessToken: string,
  path: string,
  init: RequestInit = {},
) {
  return fetch(`${getProductApiUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
}

export async function createGatewayResponse(response: Response) {
  const data = await readJson(response);
  if (response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  const problem = data as BackendProblem | null;
  return NextResponse.json(
    {
      code: mapErrorCode(response.status),
      message: problem?.detail,
      errors: problem?.errors,
    },
    { status: response.status },
  );
}

export function gatewayFailure(
  status: number,
  code: string,
  message?: string,
) {
  return NextResponse.json({ code, message }, { status });
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function mapErrorCode(status: number) {
  if (status === 400) return "VALIDATION_ERROR";
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  return "SERVICE_UNAVAILABLE";
}
