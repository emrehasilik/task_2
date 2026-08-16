"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ImageIcon,
  LoaderCircle,
  PackageOpen,
  Save,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";

import { Link, useRouter } from "@/i18n/navigation";
import {
  slugifyProductName,
  validateProductForm,
  validateSelectedProductImage,
  type SellerProductFormValues,
} from "@/lib/seller/product-form-utils";
import type { Category, Product, ProductStatus } from "@/types/api";

import { ProductImage } from "../products/product-image";
import { useSellerSession } from "./use-seller-session";

type ProductFormProps = {
  mode: "create" | "edit";
  categories: Category[];
  productId?: string;
};

const EMPTY_VALUES: SellerProductFormValues = {
  categoryId: "",
  name: "",
  slug: "",
  description: "",
  price: "",
  currency: "TRY",
  stockQuantity: "0",
  imageUrl: "",
  status: "Draft",
};

export function ProductForm({ mode, categories, productId }: ProductFormProps) {
  const t = useTranslations("Seller");
  const router = useRouter();
  const session = useSellerSession();
  const [values, setValues] = useState<SellerProductFormValues>(() => ({
    ...EMPTY_VALUES,
    categoryId: mode === "create" ? (categories[0]?.id ?? "") : "",
  }));
  const [slugEdited, setSlugEdited] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SellerProductFormValues, string>>
  >({});

  useEffect(() => {
    if (mode !== "edit" || !productId || !session.user) return;
    let active = true;

    fetch(`/api/seller/products/${productId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "notFound" : "loadError");
        return (await response.json()) as Product;
      })
      .then((product) => {
        if (!active) return;
        setValues({
          categoryId: product.categoryId,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: String(product.price),
          currency: product.currency,
          stockQuantity: String(product.stockQuantity),
          imageUrl: product.imageUrl,
          status: product.status,
          version: product.version,
        });
        setSlugEdited(true);
      })
      .catch((error: Error) => {
        if (active) setPageError(error.message === "notFound" ? "productNotFound" : "loadError");
      })
      .finally(() => {
        if (active) setLoadingProduct(false);
      });

    return () => {
      active = false;
    };
  }, [mode, productId, session.user]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function updateValue<Key extends keyof SellerProductFormValues>(
    key: Key,
    value: SellerProductFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function updateName(name: string) {
    setValues((current) => ({
      ...current,
      name,
      slug: slugEdited ? current.slug : slugifyProductName(name),
    }));
    setFieldErrors((current) => ({ ...current, name: undefined, slug: undefined }));
  }

  function selectImage(file: File | null) {
    if (!file) return;
    const validationError = validateSelectedProductImage(file);
    if (validationError) {
      setImageError(validationError);
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageError(null);
    setFieldErrors((current) => ({ ...current, imageUrl: undefined }));
  }

  function clearSelectedImage() {
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function dropImage(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    selectImage(event.dataTransfer.files.item(0));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateProductForm(values, {
      hasSelectedImage: Boolean(imageFile),
    });
    setFieldErrors(validationErrors);
    setImageError(validationErrors.imageUrl ? "imageRequired" : null);
    setPageError(null);
    if (Object.keys(validationErrors).length > 0) {
      setPageError("validationError");
      return;
    }

    setSubmitting(true);
    const endpoint =
      mode === "create" ? "/api/seller/products" : `/api/seller/products/${productId}`;

    try {
      const formData = new FormData();
      formData.set(
        "payload",
        JSON.stringify({
          ...values,
          price: Number(values.price),
          stockQuantity: Number(values.stockQuantity),
        }),
      );
      if (imageFile) formData.set("image", imageFile);

      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        body: formData,
      });

      if (!response.ok) {
        const body = (await response.json()) as { code?: string };
        setPageError(mapApiError(body.code));
        return;
      }

      router.replace("/seller");
      router.refresh();
    } catch {
      setPageError("serviceError");
    } finally {
      setSubmitting(false);
    }
  }

  if (session.loading || loadingProduct) return <FormSkeleton />;

  if (session.unavailable) {
    return <FormState title={t("sessionErrorTitle")} description={t("sessionErrorDescription")} />;
  }

  if (pageError === "productNotFound") {
    return <FormState title={t("productNotFoundTitle")} description={t("productNotFoundDescription")} />;
  }

  const title = mode === "create" ? t("createTitle") : t("editTitle");
  const description = mode === "create" ? t("createDescription") : t("editDescription");

  return (
    <div className="pb-20">
      <section className="border-b border-line bg-sage/55 paper-grid">
        <div className="page-shell py-10 sm:py-14">
          <Link href="/seller" className="inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-forest">
            <ArrowLeft className="h-4 w-4" /> {t("backToDashboard")}
          </Link>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow text-coral">{t("formEyebrow")}</div>
              <h1 className="display-text mt-3 text-5xl leading-none sm:text-6xl">{title}</h1>
              <p className="mt-4 max-w-2xl leading-7 text-muted">{description}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-bold text-forest">
              <Sparkles className="h-4 w-4" /> {t("formNote")}
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="page-shell mt-8 grid gap-7 lg:grid-cols-[1fr_21rem]">
        <div className="space-y-6">
          {pageError && pageError !== "productNotFound" && (
            <div role="alert" className="rounded-2xl border border-coral/30 bg-coral/10 px-5 py-4 text-sm font-bold text-coral">
              {t(pageError)}
            </div>
          )}

          <FormSection title={t("basicInformation")} description={t("basicInformationDescription")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("productName")} error={fieldErrors.name ? t("invalidName") : undefined} className="sm:col-span-2">
                <input value={values.name} onChange={(event) => updateName(event.target.value)} maxLength={160} required className={inputClass(Boolean(fieldErrors.name))} placeholder={t("productNamePlaceholder")} />
              </Field>
              <Field label={t("slug")} hint={t("slugHint")} error={fieldErrors.slug ? t("invalidSlug") : undefined}>
                <input value={values.slug} onChange={(event) => { setSlugEdited(true); updateValue("slug", event.target.value.toLowerCase()); }} onBlur={() => updateValue("slug", slugifyProductName(values.slug))} maxLength={180} required className={inputClass(Boolean(fieldErrors.slug))} placeholder="el-yapimi-seramik-kupa" />
              </Field>
              <Field label={t("category")} error={fieldErrors.categoryId ? t("invalidCategory") : undefined}>
                <select value={values.categoryId} onChange={(event) => updateValue("categoryId", event.target.value)} required disabled={categories.length === 0} className={inputClass(Boolean(fieldErrors.categoryId))}>
                  {categories.length === 0 && <option value="">{t("categoriesUnavailable")}</option>}
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </Field>
            </div>

            <Field label={t("productDescription")} hint={t("descriptionHint")} error={fieldErrors.description ? t("invalidDescription") : undefined}>
              <textarea value={values.description} onChange={(event) => updateValue("description", event.target.value)} rows={7} maxLength={4_000} required className={`${inputClass(Boolean(fieldErrors.description))} min-h-40 resize-y py-4`} placeholder={t("descriptionPlaceholder")} />
            </Field>
          </FormSection>

          <FormSection title={t("salesInformation")} description={t("salesInformationDescription")}>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label={t("price")} error={fieldErrors.price ? t("invalidPrice") : undefined}>
                <input value={values.price} onChange={(event) => updateValue("price", event.target.value)} type="number" min="0.01" max="10000000" step="0.01" inputMode="decimal" required className={inputClass(Boolean(fieldErrors.price))} placeholder="0.00" />
              </Field>
              <Field label={t("currency")} error={fieldErrors.currency ? t("invalidCurrency") : undefined}>
                <select value={values.currency} onChange={(event) => updateValue("currency", event.target.value)} className={inputClass(Boolean(fieldErrors.currency))}>
                  <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option>
                </select>
              </Field>
              <Field label={t("stockQuantity")} error={fieldErrors.stockQuantity ? t("invalidStock") : undefined}>
                <input value={values.stockQuantity} onChange={(event) => updateValue("stockQuantity", event.target.value)} type="number" min="0" max="1000000" step="1" inputMode="numeric" required className={inputClass(Boolean(fieldErrors.stockQuantity))} />
              </Field>
            </div>
          </FormSection>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface card-shadow">
            <div className="relative aspect-[4/3] bg-sage">
              {imagePreviewUrl ? (
                <Image src={imagePreviewUrl} alt={values.name || t("imagePreview")} fill sizes="336px" unoptimized className="object-cover" />
              ) : values.imageUrl ? (
                <ProductImage src={values.imageUrl} alt={values.name || t("imagePreview")} sizes="336px" />
              ) : (
                <div className="grid h-full place-items-center text-center text-forest"><div><ImageIcon className="mx-auto h-9 w-9 opacity-70" /><div className="mt-2 text-xs font-bold">{t("imagePreview")}</div></div></div>
              )}
            </div>
            <div className="p-5">
              <div className="text-sm font-extrabold">{t("productImage")}</div>
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={dropImage}
                className={`mt-3 rounded-2xl border border-dashed p-4 text-center transition-colors ${imageError ? "border-coral bg-coral/5" : "border-line bg-paper hover:border-forest"}`}
              >
                <input
                  ref={imageInputRef}
                  id="product-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => selectImage(event.target.files?.item(0) ?? null)}
                />
                <Upload className="mx-auto h-6 w-6 text-forest" />
                <label htmlFor="product-image" className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-full bg-forest px-4 text-xs font-black text-white hover:bg-forest-dark">
                  {imageFile ? t("replaceImage") : t("chooseImage")}
                </label>
                <p className="mt-3 text-xs leading-5 text-muted">{t("imageUploadHint")}</p>
                {imageFile && <p className="mt-2 truncate text-xs font-bold text-ink">{imageFile.name}</p>}
              </div>
              {imageError && <p className="mt-2 text-xs font-bold text-coral">{t(imageError)}</p>}
              {imageFile && (
                <button type="button" onClick={clearSelectedImage} className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-muted hover:text-coral">
                  <X className="h-3.5 w-3.5" /> {t("removeSelectedImage")}
                </button>
              )}
              {mode === "edit" && !imageFile && values.imageUrl && <p className="mt-3 text-xs leading-5 text-muted">{t("existingImageHint")}</p>}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-line bg-surface p-5 card-shadow">
            <Field label={t("publicationStatus")} hint={t("statusHint")}>
              <select value={values.status} onChange={(event) => updateValue("status", event.target.value as ProductStatus)} className={inputClass(false)}>
                <option value="Draft">{t("statusDraft")}</option>
                <option value="Published">{t("statusPublished")}</option>
                <option value="OutOfStock">{t("statusOutOfStock")}</option>
                {mode === "edit" && <option value="Archived">{t("statusArchived")}</option>}
              </select>
            </Field>

            <button type="submit" disabled={submitting || categories.length === 0} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-black text-white transition-colors hover:bg-forest-dark disabled:cursor-wait disabled:opacity-55">
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {submitting ? t("saving") : mode === "create" ? t("createAction") : t("updateAction")}
            </button>
            <Link href="/seller" className="mt-2 inline-flex h-11 w-full items-center justify-center text-sm font-extrabold text-muted hover:text-ink">{t("cancel")}</Link>
          </div>
        </aside>
      </form>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-[1.75rem] border border-line bg-surface p-5 card-shadow sm:p-7"><h2 className="display-text text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p><div className="mt-6 space-y-5">{children}</div></section>;
}

function Field({ label, hint, error, className, children }: { label: string; hint?: string; error?: string; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className ?? ""}`}><span className="mb-2 block text-sm font-extrabold">{label}</span>{children}{hint && !error && <span className="mt-2 block text-xs leading-5 text-muted">{hint}</span>}{error && <span className="mt-2 block text-xs font-bold text-coral">{error}</span>}</label>;
}

function inputClass(error: boolean) {
  return `h-12 w-full rounded-2xl border bg-paper px-4 text-sm outline-none transition-colors ${error ? "border-coral" : "border-line focus:border-forest"}`;
}

function FormSkeleton() {
  return <div className="page-shell py-14"><div className="h-28 animate-pulse rounded-[2rem] bg-sage" /><div className="mt-7 grid gap-6 lg:grid-cols-[1fr_21rem]"><div className="h-[34rem] animate-pulse rounded-[2rem] bg-surface" /><div className="h-80 animate-pulse rounded-[2rem] bg-surface" /></div></div>;
}

function FormState({ title, description }: { title: string; description: string }) {
  const t = useTranslations("Seller");
  return <div className="page-shell py-20"><div className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-8 text-center card-shadow"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-coral/10 text-coral"><AlertTriangle className="h-6 w-6" /></div><h1 className="display-text mt-5 text-4xl">{title}</h1><p className="mt-3 text-muted">{description}</p><Link href="/seller" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-sm font-black text-white"><PackageOpen className="h-4 w-4" />{t("backToDashboard")}</Link></div></div>;
}

function mapApiError(code?: string) {
  if (code === "IMAGE_REQUIRED") return "imageRequired";
  if (code === "INVALID_IMAGE_TYPE" || code === "INVALID_IMAGE_CONTENT") return "invalidImageType";
  if (code === "IMAGE_TOO_LARGE") return "imageTooLarge";
  if (code === "STORAGE_NOT_CONFIGURED") return "storageNotConfigured";
  if (code === "STORAGE_UPLOAD_FAILED") return "imageUploadError";
  if (code === "CONFLICT") return "conflictError";
  if (code === "VALIDATION_ERROR" || code === "INVALID_REQUEST") return "validationError";
  if (code === "FORBIDDEN") return "forbiddenError";
  if (code === "UNAUTHENTICATED") return "sessionExpiredError";
  return "serviceError";
}
