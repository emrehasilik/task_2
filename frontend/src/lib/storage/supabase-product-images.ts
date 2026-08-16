import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
  client: SupabaseClient;
  origin: string;
};

export async function uploadProductImage(
  sellerId: string,
  file: File,
): Promise<UploadedProductImage> {
  const extension = await validateImage(file);
  const config = getStorageConfig();
  const sellerPath = safeSellerPath(sellerId);
  const objectPath = `${sellerPath}/${crypto.randomUUID()}.${extension}`;

  const { error } = await config.client.storage.from(config.bucket).upload(objectPath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Supabase product image upload failed", {
      message: error.message,
      sellerId,
    });
    throw new ProductImageStorageError("STORAGE_UPLOAD_FAILED", 502);
  }

  const { data } = config.client.storage.from(config.bucket).getPublicUrl(objectPath);
  return { objectPath, publicUrl: data.publicUrl };
}

export async function removeUploadedProductImage(objectPath: string) {
  const config = getStorageConfig();
  const { error } = await config.client.storage.from(config.bucket).remove([objectPath]);
  if (error) throw error;
}

export async function removeProductImageByUrl(imageUrl: string, sellerId: string) {
  const config = getStorageConfig();
  const objectPath = ownedObjectPath(imageUrl, sellerId, config);
  if (!objectPath) return false;

  const { error } = await config.client.storage.from(config.bucket).remove([objectPath]);
  if (error) throw error;
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
    client: createClient(url.origin, secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    }),
    origin: url.origin,
  };
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
