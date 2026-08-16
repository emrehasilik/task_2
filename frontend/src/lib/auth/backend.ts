import "server-only";

import { getAuthApiUrl } from "@/lib/api/config";
import type { AuthResponse } from "@/types/api";

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_EXISTS"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE";

export async function authRequest(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: AuthResponse } | { ok: false; status: number; code: AuthErrorCode }> {
  try {
    const response = await fetch(`${getAuthApiUrl()}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (response.ok) {
      return { ok: true, data: (await response.json()) as AuthResponse };
    }

    const code: AuthErrorCode =
      response.status === 401
        ? "INVALID_CREDENTIALS"
        : response.status === 409
          ? "EMAIL_EXISTS"
          : response.status === 429
            ? "RATE_LIMITED"
            : "INVALID_REQUEST";
    return { ok: false, status: response.status, code };
  } catch {
    return { ok: false, status: 503, code: "SERVICE_UNAVAILABLE" };
  }
}
