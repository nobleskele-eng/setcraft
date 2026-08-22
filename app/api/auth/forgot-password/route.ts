import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, normalizeEmail, validEmail } from "../../../auth";
import { passwordResetEmailConfigured, sendPasswordResetEmail } from "../../../email";

const GENERIC_MESSAGE = "If an account matches that email, a reset link will arrive shortly.";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const email = normalizeEmail(typeof body?.email === "string" ? body.email.slice(0, 254) : "");
  if (!validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const deliveryConfigured = passwordResetEmailConfigured();
  if (!deliveryConfigured) {
    return NextResponse.json({ ok: true, deliveryConfigured: false, message: GENERIC_MESSAGE });
  }

  try {
    const reset = await createPasswordResetToken(email);
    if (reset) {
      const resetUrl = new URL(`/reset-password?token=${encodeURIComponent(reset.token)}`, request.url).toString();
      await sendPasswordResetEmail({ to: reset.email, displayName: reset.displayName, resetUrl });
    }
  } catch (error) {
    console.error("[LaneLab auth] Password reset request failed:", error instanceof Error ? error.message : "Unknown error");
  }
  return NextResponse.json({ ok: true, deliveryConfigured: true, message: GENERIC_MESSAGE });
}

