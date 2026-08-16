export function getAuthApiUrl() {
  return (process.env.AUTH_API_URL ?? "http://localhost:5001").replace(/\/$/, "");
}

export function getProductApiUrl() {
  return (process.env.PRODUCT_API_URL ?? "http://localhost:5002").replace(/\/$/, "");
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
