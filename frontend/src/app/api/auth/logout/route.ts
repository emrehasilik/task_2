import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthApiUrl } from "@/lib/api/config";
import { REFRESH_TOKEN_COOKIE, clearAuthCookies } from "@/lib/auth/cookies";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(`${getAuthApiUrl()}/api/v1/auth/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      // Local cookies are cleared even if the backend is temporarily unavailable.
    }
  }

  await clearAuthCookies();
  return new NextResponse(null, { status: 204 });
}
