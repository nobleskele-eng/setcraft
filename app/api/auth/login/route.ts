import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  normalizeEmail,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  validEmail,
  verifyCredentials,
} from "../../../auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const email = normalizeEmail(typeof body?.email === "string" ? body.email.slice(0, 254) : "");
  const password = typeof body?.password === "string" ? body.password : "";
  if (!validEmail(email) || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  try {
    const user = await verifyCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    const session = await createSession(user.id);
    const response = NextResponse.json({ ok: true, redirect: safeNext(body?.next) });
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires: session.expiresAt,
    });
    return response;
  } catch (error) {
    console.error("[SetCraft auth] Login failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Login is temporarily unavailable. Please try again." }, { status: 500 });
  }
}

function safeNext(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/studio";
  return value;
}
