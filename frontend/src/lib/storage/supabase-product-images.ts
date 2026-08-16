import "server-only";

import {
  hasValidProductImageSignature,
  isProductImageMimeType,
  PRODUCT_IMAGE_MAX_BYTES,
  productImageExtension,
} from "./product-image-policy";

export type ProductImageStorageErrorCode =
  | "IMAGE_REQUIRED"
  | "INVALID_IMAGE_TYPE"
  | "IMAGE_TOO_LARGE"
  | "INVALID_IMAGE_CONTENT"
  | "STORAGE_NOT_CONFIGURED"
  | "STORAGE_UPLOAD_FAILED";

export class ProductImageStorageError extends Error {
  constructor(
    public readonly code: ProductImageStorageErrorCode,
    public readonly status: number,
  ) {
    super(code);
    this.name = "ProductImageStorageError";
  }
}

export type UploadedProductImage = {
  objectPath: string;
  publicUrl: string;
};

type StorageConfig = {
  bucket: string;
  origin: string;
  secretKey: string;
};

export async function uploadProductImage(
  sellerId: string,
  file: File,
): Promise<UploadedProductImage> {
  const extension = await validateImage(file);
  const config = getStorageConfig();
  const sellerPath = safeSellerPath(sellerId);
  const objectPath = `${sellerPath}/${crypto.randomUUID()}.${extension}`;

  const response = await fetch(storageObjectUrl(config, objectPath), {
    method: "POST",
    headers: storageHeaders(config, {
      "Cache-Control": "max-age=31536000",
      "Content-Type": file.type,
      "x-upsert": "false",
    }),
    body: file,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    console.error("Supabase product image upload failed", {
      sellerId,
      status: response.status,
    });
    throw new ProductImageStorageError("STORAGE_UPLOAD_FAILED", 502);
  }

  return { objectPath, publicUrl: publicObjectUrl(config, objectPath) };
}

export async function removeUploadedProductImage(objectPath: string) {
  const config = getStorageConfig();
  await removeObjects(config, [objectPath]);
}

export async function removeProductImageByUrl(imageUrl: string, sellerId: string) {
  const config = getStorageConfig();
  const objectPath = ownedObjectPath(imageUrl, sellerId, config);
  if (!objectPath) return false;

  await removeObjects(config, [objectPath]);
  return true;
}

async function validateImage(file: File) {
  if (!file || file.size === 0) {
    throw new ProductImageStorageError("IMAGE_REQUIRED", 400);
  }
  if (!isProductImageMimeType(file.type)) {
    throw new ProductImageStorageError("INVALID_IMAGE_TYPE", 400);
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new ProductImageStorageError("IMAGE_TOO_LARGE", 413);
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasValidProductImageSignature(file.type, header)) {
    throw new ProductImageStorageError("INVALID_IMAGE_CONTENT", 400);
  }

  return productImageExtension(file.type);
}

function getStorageConfig(): StorageConfig {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const secretKey = (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();
  const bucket = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET?.trim() || "product-images";

  if (!rawUrl || !secretKey || !/^[a-z0-9][a-z0-9_-]*$/i.test(bucket)) {
    throw new ProductImageStorageError("STORAGE_NOT_CONFIGURED", 503);
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ProductImageStorageError("STORAGE_NOT_CONFIGURED", 503);
  }
  if (url.protocol !== "https:") {
    throw new ProductImageStorageError("STORAGE_NOT_CONFIGURED", 503);
  }

  return {
    bucket,
    origin: url.origin,
    secretKey,
  };
}

async function removeObjects(config: StorageConfig, objectPaths: string[]) {
  const response = await fetch(
    `${config.origin}/storage/v1/object/${encodeURIComponent(config.bucket)}`,
    {
      method: "DELETE",
      headers: storageHeaders(config, { "Content-Type": "application/json" }),
      body: JSON.stringify({ prefixes: objectPaths }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase Storage delete failed with status ${response.status}.`);
  }
}

function storageHeaders(config: StorageConfig, additional: Record<string, string>) {
  const headers: Record<string, string> = {
    // New sb_secret keys are API keys, not JWTs. Sending one as a Bearer token
    // makes the Storage gateway reject it as an invalid compact JWS.
    apikey: config.secretKey,
    ...additional,
  };

  // Legacy service_role keys are JWTs and still require an Authorization header.
  // This keeps existing Supabase projects compatible while preferring sb_secret keys.
  if (!config.secretKey.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${config.secretKey}`;
  }

  return headers;
}

function storageObjectUrl(config: StorageConfig, objectPath: string) {
  return `${config.origin}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodeObjectPath(objectPath)}`;
}

function publicObjectUrl(config: StorageConfig, objectPath: string) {
  return `${config.origin}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${encodeObjectPath(objectPath)}`;
}

function encodeObjectPath(objectPath: string) {
  return objectPath.split("/").map(encodeURIComponent).join("/");
}

function ownedObjectPath(imageUrl: string, sellerId: string, config: StorageConfig) {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return null;
  }

  const prefix = `/storage/v1/object/public/${config.bucket}/`;
  if (url.origin !== config.origin || !url.pathname.startsWith(prefix)) return null;

  const objectPath = decodeURIComponent(url.pathname.slice(prefix.length));
  const sellerPrefix = `${safeSellerPath(sellerId)}/`;
  return objectPath.startsWith(sellerPrefix) ? objectPath : null;
}

function safeSellerPath(sellerId: string) {
  const safeValue = sellerId.trim().replace(/[^a-z0-9_-]/gi, "");
  if (!safeValue) throw new ProductImageStorageError("STORAGE_UPLOAD_FAILED", 502);
  return safeValue;
}
