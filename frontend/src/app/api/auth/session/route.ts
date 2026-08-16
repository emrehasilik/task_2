import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthApiUrl } from "@/lib/api/config";
import { authRequest } from "@/lib/auth/backend";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  persistAuthCookies,
} from "@/lib/auth/cookies";
import type { User } from "@/types/api";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken) {
    try {
      const response = await fetch(`${getAuthApiUrl()}/api/v1/auth/me`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) {
        return NextResponse.json((await response.json()) as User);
      }
    } catch {
      return NextResponse.json({ code: "SERVICE_UNAVAILABLE" }, { status: 503 });
    }
  }

  if (refreshToken) {
    const refreshed = await authRequest("/api/v1/auth/refresh", { refreshToken });
    if (refreshed.ok) {
      await persistAuthCookies(refreshed.data);
      return NextResponse.json(refreshed.data.user);
    }
  }

  await clearAuthCookies();
  return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 });
}
