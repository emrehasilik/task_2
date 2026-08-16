import "server-only";

import { cookies } from "next/headers";

import type { AuthResponse } from "@/types/api";

export const ACCESS_TOKEN_COOKIE = "localcart_access";
export const REFRESH_TOKEN_COOKIE = "localcart_refresh";

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function persistAuthCookies(auth: AuthResponse) {
  const cookieStore = await cookies();
  const accessMaxAge = Math.max(
    60,
    Math.floor((new Date(auth.accessTokenExpiresAtUtc).getTime() - Date.now()) / 1000),
  );

  cookieStore.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
    ...baseOptions,
    maxAge: accessMaxAge,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, auth.refreshToken, {
    ...baseOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, "", { ...baseOptions, maxAge: 0 });
  cookieStore.set(REFRESH_TOKEN_COOKIE, "", { ...baseOptions, maxAge: 0 });
}
