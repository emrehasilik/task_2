import { NextResponse } from "next/server";

import { authRequest } from "@/lib/auth/backend";
import { persistAuthCookies } from "@/lib/auth/cookies";
import type { UserRole } from "@/types/api";

export async function POST(request: Request) {
  let body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  if (
    !body.firstName ||
    !body.lastName ||
    !body.email ||
    !body.password ||
    !["Customer", "Seller"].includes(body.role ?? "")
  ) {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await authRequest("/api/v1/auth/register", {
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    email: body.email.trim(),
    password: body.password,
    role: body.role,
  });
  if (!result.ok) {
    return NextResponse.json({ code: result.code }, { status: result.status });
  }

  await persistAuthCookies(result.data);
  return NextResponse.json(result.data.user, { status: 201 });
}
