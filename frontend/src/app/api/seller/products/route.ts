import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSellerSession } from "@/lib/auth/seller-session";
import {
  createGatewayResponse,
  gatewayFailure,
  parseProductMutationRequest,
  productApiFetch,
} from "@/lib/seller/product-gateway";
import {
  ProductImageStorageError,
  removeUploadedProductImage,
  uploadProductImage,
  type UploadedProductImage,
} from "@/lib/storage/supabase-product-images";

export async function GET(request: Request) {
  const session = await requireSellerSession();
  if (!session.ok) {
    return gatewayFailure(session.status, session.code);
  }

  const incomingUrl = new URL(request.url);
  const page = safeInteger(incomingUrl.searchParams.get("page"), 1, 10_000);
  const pageSize = safeInteger(incomingUrl.searchParams.get("pageSize"), 20, 50);

  try {
    const response = await productApiFetch(
      session.accessToken,
      `/api/v1/products/mine?page=${page}&pageSize=${pageSize}`,
    );
    return createGatewayResponse(response);
  } catch {
    return gatewayFailure(503, "SERVICE_UNAVAILABLE");
  }
}

export async function POST(request: Request) {
  const session = await requireSellerSession();
  if (!session.ok) {
    return gatewayFailure(session.status, session.code);
  }

  let mutation: Awaited<ReturnType<typeof parseProductMutationRequest>>;
  try {
    mutation = await parseProductMutationRequest(request);
  } catch {
    mutation = null;
  }

  if (!mutation?.payload || mutation.payload.status === "Archived") {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }
  if (!mutation.image) {
    return NextResponse.json({ code: "IMAGE_REQUIRED" }, { status: 400 });
  }

  let uploadedImage: UploadedProductImage;
  try {
    uploadedImage = await uploadProductImage(session.user.id, mutation.image);
  } catch (error) {
    return storageFailure(error);
  }

  try {
    const response = await productApiFetch(session.accessToken, "/api/v1/products", {
      method: "POST",
      body: JSON.stringify({
        ...mutation.payload,
        imageUrl: uploadedImage.publicUrl,
      }),
    });
    if (!response.ok) await cleanupUploadedImage(uploadedImage.objectPath);
    const gatewayResponse = await createGatewayResponse(response);
    if (response.ok) revalidateCatalog();
    return gatewayResponse;
  } catch {
    await cleanupUploadedImage(uploadedImage.objectPath);
    return gatewayFailure(503, "SERVICE_UNAVAILABLE");
  }
}

function safeInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function revalidateCatalog() {
  revalidatePath("/tr");
  revalidatePath("/en");
  revalidatePath("/tr/products");
  revalidatePath("/en/products");
}

async function cleanupUploadedImage(objectPath: string) {
  try {
    await removeUploadedProductImage(objectPath);
  } catch (error) {
    console.error("Supabase product image rollback failed", { error, objectPath });
  }
}

function storageFailure(error: unknown) {
  if (error instanceof ProductImageStorageError) {
    return gatewayFailure(error.status, error.code);
  }

  console.error("Unexpected product image upload failure", { error });
  return gatewayFailure(502, "STORAGE_UPLOAD_FAILED");
}
