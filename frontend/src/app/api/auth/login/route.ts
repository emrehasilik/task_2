import { NextResponse } from "next/server";

import { authRequest } from "@/lib/auth/backend";
import { persistAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await authRequest("/api/v1/auth/login", {
    email: body.email.trim(),
    password: body.password,
  });
  if (!result.ok) {
    return NextResponse.json({ code: result.code }, { status: result.status });
  }

  await persistAuthCookies(result.data);
  return NextResponse.json(result.data.user);
}
