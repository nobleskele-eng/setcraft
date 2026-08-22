import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken, validatePassword } from "../../../auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const token = typeof body?.token === "string" ? body.token.trim().slice(0, 180) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";
  if (token.length < 32) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  const passwordError = validatePassword(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
  if (password !== confirmPassword) return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });

  try {
    if (!await resetPasswordWithToken(token, password)) {
      return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[LaneLab auth] Password reset failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Password reset is temporarily unavailable. Please try again." }, { status: 500 });
  }
}

