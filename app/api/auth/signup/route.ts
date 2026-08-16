import { NextRequest, NextResponse } from "next/server";
import {
  createAccount,
  createSession,
  normalizeEmail,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  validEmail,
  validatePassword,
} from "../../../auth";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const fullName = text(body.fullName, 100);
  const email = normalizeEmail(text(body.email, 254));
  const password = typeof body.password === "string" ? body.password : "";
  const phone = text(body.phone, 30);
  const clubName = text(body.clubName, 120);
  const clubRole = text(body.clubRole, 60);
  const clubCity = text(body.clubCity, 120);
  const clubCourse = text(body.clubCourse, 30);

  if (fullName.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  if (!validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const passwordError = validatePassword(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  try {
    const user = await createAccount({
      fullName,
      email,
      password,
      phone,
      clubName,
      clubRole,
      clubCity,
      clubCourse,
    });
    if (!user) throw new Error("Account could not be created.");
    const session = await createSession(user.id);
    const response = NextResponse.json({ ok: true, redirect: "/studio" }, { status: 201 });
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
    const message = error instanceof Error ? error.message : "";
    if (/unique|constraint/i.test(message)) {
      return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    }
    console.error("[SetCraft auth] Sign-up failed:", message || "Unknown error");
    return NextResponse.json({ error: "We could not create your account. Please try again." }, { status: 500 });
  }
}
