import "server-only";

import { cookies } from "next/headers";

import { getAuthApiUrl } from "@/lib/api/config";
import { authRequest } from "@/lib/auth/backend";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  persistAuthCookies,
} from "@/lib/auth/cookies";
import type { User } from "@/types/api";

export type SellerSessionResult =
  | { ok: true; accessToken: string; user: User }
  | {
      ok: false;
      status: 401 | 403 | 503;
      code: "UNAUTHENTICATED" | "FORBIDDEN" | "SERVICE_UNAVAILABLE";
    };

export async function requireSellerSession(): Promise<SellerSessionResult> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken) {
    const verified = await verifyAccessToken(accessToken);
    if (verified.kind === "verified") {
      return verified.user.role === "Seller"
        ? { ok: true, accessToken, user: verified.user }
        : { ok: false, status: 403, code: "FORBIDDEN" };
    }

    if (verified.kind === "unavailable") {
      return { ok: false, status: 503, code: "SERVICE_UNAVAILABLE" };
    }
  }

  if (refreshToken) {
    const refreshed = await authRequest("/api/v1/auth/refresh", { refreshToken });
    if (refreshed.ok) {
      await persistAuthCookies(refreshed.data);
      return refreshed.data.user.role === "Seller"
        ? {
            ok: true,
            accessToken: refreshed.data.accessToken,
            user: refreshed.data.user,
          }
        : { ok: false, status: 403, code: "FORBIDDEN" };
    }

    if (refreshed.code === "SERVICE_UNAVAILABLE") {
      return { ok: false, status: 503, code: "SERVICE_UNAVAILABLE" };
    }
  }

  await clearAuthCookies();
  return { ok: false, status: 401, code: "UNAUTHENTICATED" };
}

async function verifyAccessToken(token: string): Promise<
  | { kind: "verified"; user: User }
  | { kind: "invalid" }
  | { kind: "unavailable" }
> {
  try {
    const response = await fetch(`${getAuthApiUrl()}/api/v1/auth/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (response.ok) {
      return { kind: "verified", user: (await response.json()) as User };
    }

    return response.status === 401
      ? { kind: "invalid" }
      : { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}
