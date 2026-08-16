import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSellerSession } from "@/lib/auth/seller-session";
import {
  createGatewayResponse,
  gatewayFailure,
  getOwnedProduct,
  parseProductMutationRequest,
  productApiFetch,
} from "@/lib/seller/product-gateway";
import {
  ProductImageStorageError,
  removeProductImageByUrl,
  removeUploadedProductImage,
  uploadProductImage,
  type UploadedProductImage,
} from "@/lib/storage/supabase-product-images";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSellerSession();
  if (!session.ok) {
    return gatewayFailure(session.status, session.code);
  }

  const { id } = await context.params;
  try {
    const owned = await getOwnedProduct(session.accessToken, id, session.user.id);
    if (owned.ok) return NextResponse.json(owned.product);
    if (owned.response) return createGatewayResponse(owned.response);
    return gatewayFailure(404, "NOT_FOUND");
  } catch {
    return gatewayFailure(503, "SERVICE_UNAVAILABLE");
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  if (!mutation?.payload?.version) {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const { id } = await context.params;
  let existingProduct;
  try {
    const owned = await getOwnedProduct(session.accessToken, id, session.user.id);
    if (!owned.ok) {
      if (owned.response) return createGatewayResponse(owned.response);
      return gatewayFailure(404, "NOT_FOUND");
    }
    existingProduct = owned.product;
  } catch {
    return gatewayFailure(503, "SERVICE_UNAVAILABLE");
  }

  let uploadedImage: UploadedProductImage | null = null;
  if (mutation.image) {
    try {
      uploadedImage = await uploadProductImage(session.user.id, mutation.image);
    } catch (error) {
      return storageFailure(error);
    }
  }

  try {
    const response = await productApiFetch(
      session.accessToken,
      `/api/v1/products/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          ...mutation.payload,
          imageUrl: uploadedImage?.publicUrl ?? existingProduct.imageUrl,
        }),
      },
    );
    if (!response.ok && uploadedImage) {
      await cleanupUploadedImage(uploadedImage.objectPath);
    }
    const gatewayResponse = await createGatewayResponse(response);
    if (response.ok) {
      if (uploadedImage) {
        await cleanupExistingImage(existingProduct.imageUrl, session.user.id);
      }
      revalidateCatalog(id);
    }
    return gatewayResponse;
  } catch {
    if (uploadedImage) await cleanupUploadedImage(uploadedImage.objectPath);
    return gatewayFailure(503, "SERVICE_UNAVAILABLE");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSellerSession();
  if (!session.ok) {
    return gatewayFailure(session.status, session.code);
  }

  const version = new URL(request.url).searchParams.get("version");
  if (!version) {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const owned = await getOwnedProduct(session.accessToken, id, session.user.id);
    if (!owned.ok) {
      if (owned.response) return createGatewayResponse(owned.response);
      return gatewayFailure(404, "NOT_FOUND");
    }

    const response = await productApiFetch(
      session.accessToken,
      `/api/v1/products/${encodeURIComponent(id)}?version=${encodeURIComponent(version)}`,
      { method: "DELETE" },
    );

    if (response.ok) {
      await cleanupExistingImage(owned.product.imageUrl, session.user.id);
      revalidateCatalog(id);
      return new NextResponse(null, { status: 204 });
    }

    return createGatewayResponse(response);
  } catch {
    return gatewayFailure(503, "SERVICE_UNAVAILABLE");
  }
}

async function cleanupUploadedImage(objectPath: string) {
  try {
    await removeUploadedProductImage(objectPath);
  } catch (error) {
    console.error("Supabase product image rollback failed", { error, objectPath });
  }
}

async function cleanupExistingImage(imageUrl: string, sellerId: string) {
  try {
    await removeProductImageByUrl(imageUrl, sellerId);
  } catch (error) {
    console.error("Supabase product image cleanup failed", { error, sellerId });
  }
}

function storageFailure(error: unknown) {
  if (error instanceof ProductImageStorageError) {
    return gatewayFailure(error.status, error.code);
  }

  console.error("Unexpected product image upload failure", { error });
  return gatewayFailure(502, "STORAGE_UPLOAD_FAILED");
}

function revalidateCatalog(id: string) {
  revalidatePath("/tr");
  revalidatePath("/en");
  revalidatePath("/tr/products");
  revalidatePath("/en/products");
  revalidatePath(`/tr/products/${id}`);
  revalidatePath(`/en/products/${id}`);
}
