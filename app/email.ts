import { SUPPORT_EMAIL } from "../src/siteDetails";
import { env } from "cloudflare:workers";

type EmailEnv = {
  RESEND_API_KEY?: string;
  PASSWORD_RESET_FROM_EMAIL?: string;
};

function emailEnv() {
  return env as unknown as EmailEnv;
}

export function passwordResetEmailConfigured() {
  const config = emailEnv();
  return Boolean(config.RESEND_API_KEY?.trim() && config.PASSWORD_RESET_FROM_EMAIL?.trim());
}

export async function sendPasswordResetEmail(input: { to: string; displayName: string; resetUrl: string }) {
  const config = emailEnv();
  const apiKey = config.RESEND_API_KEY?.trim();
  const from = config.PASSWORD_RESET_FROM_EMAIL?.trim();
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Reset your LaneLab password",
      html: resetEmailHtml(input.displayName, input.resetUrl),
      text: `Reset your LaneLab password using this secure link: ${input.resetUrl}\n\nThis link expires in 20 minutes and can be used once. If you did not request it, ignore this email.`,
      reply_to: SUPPORT_EMAIL,
    }),
  });
  if (!response.ok) throw new Error(`Password reset email failed (${response.status}).`);
  return true;
}

function resetEmailHtml(displayName: string, resetUrl: string) {
  const safeName = escapeHtml(displayName || "Coach");
  const safeUrl = escapeHtml(resetUrl);
  return `<!doctype html><html><body style="margin:0;background:#edf3f2;font-family:Arial,sans-serif;color:#12323c"><div style="max-width:600px;margin:0 auto;padding:44px 20px"><div style="background:#071f2c;border-radius:14px;padding:34px;color:#fff"><p style="margin:0;color:#5bd7e6;font-size:12px;font-weight:700;letter-spacing:.12em">LANELAB ACCOUNT SECURITY</p><h1 style="margin:18px 0 12px;font-size:34px;line-height:1.05">Reset your password</h1><p style="margin:0;color:#b9c8cc;line-height:1.7">Hi ${safeName}, use the secure button below to choose a new LaneLab password. The link expires in 20 minutes and works once.</p><a href="${safeUrl}" style="display:inline-block;margin-top:28px;border-radius:7px;background:#5bd7e6;padding:14px 20px;color:#08232e;font-weight:800;text-decoration:none">Choose a new password</a><p style="margin:28px 0 0;color:#789096;font-size:12px;line-height:1.6">If you did not request this reset, ignore this email. Your current password will stay unchanged.</p></div></div></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}
