"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SUPPORT_EMAIL } from "../siteDetails";

export default function AccountRecovery({ mode }: { mode: "forgot" | "reset" }) {
  const isForgot = mode === "forgot";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deliveryConfigured, setDeliveryConfigured] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenAvailable, setTokenAvailable] = useState(isForgot);

  useEffect(() => {
    if (!isForgot) setTokenAvailable(Boolean(new URLSearchParams(window.location.search).get("token")));
  }, [isForgot]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isForgot && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, FormDataEntryValue>;
    if (!isForgot) values.token = new URLSearchParams(window.location.search).get("token") || "";
    try {
      const response = await fetch(`/api/auth/${isForgot ? "forgot-password" : "reset-password"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({})) as { error?: string; message?: string; deliveryConfigured?: boolean };
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (isForgot) {
        setDeliveryConfigured(data.deliveryConfigured !== false);
        setSuccess(data.message || "Check your email for a reset link.");
      } else {
        setSuccess("Your password has been changed and all previous sessions have been signed out.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="sc-account-page sc-recovery-page">
      <section className="sc-account-visual" aria-label="LaneLab account security">
        <Link className="sc-account-back" href="/"><ArrowLeft /> Back to LaneLab</Link>
        <div className="sc-account-visual-content"><span className="sc-account-icon">{isForgot ? <Mail /> : <KeyRound />}</span><p className="sc-account-overline">LaneLab account security</p><h1>{isForgot ? "Get back to the work behind the work." : "Choose a stronger way back in."}</h1><p>{isForgot ? "Request a short-lived, single-use reset link without revealing whether an email is registered." : "A successful reset changes the password and signs out every previous LaneLab session."}</p></div>
        <p className="sc-account-visual-foot">Secure reset <span /> One-time link · 20 minutes</p>
      </section>
      <section className="sc-account-form-side"><div className="sc-account-form-wrap">
        <Link className="sc-account-logo" href="/" aria-label="LaneLab home"><span className="sc-landing-logo-mark" aria-hidden="true"><span /><span /><span /></span><strong>LaneLab</strong></Link>
        <div className="sc-account-heading"><p>{isForgot ? "Account recovery" : "Secure password reset"}</p><h2>{isForgot ? "Forgot your password?" : "Create a new password"}</h2><span>{isForgot ? "Enter your LaneLab email. For security, the response is the same whether or not an account exists." : "Use a unique password you do not use on another site."}</span></div>
        {success ? <div className="sc-recovery-success"><CheckCircle2 /><div><strong>{isForgot ? "Request received" : "Password updated"}</strong><p>{success}</p>{isForgot && !deliveryConfigured && <p>Email delivery is still being configured. Contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for account help.</p>}<Link href={isForgot ? "/login" : "/login"}>{isForgot ? "Return to login" : "Log in with the new password"} <ArrowRight /></Link></div></div> : !tokenAvailable ? <div className="sc-recovery-success sc-recovery-invalid"><LifeBuoy /><div><strong>Reset link missing</strong><p>Request a new password-reset link to continue.</p><Link href="/forgot-password">Request a new link <ArrowRight /></Link></div></div> : <form className="sc-account-form" onSubmit={submit}>
          <fieldset>{isForgot ? <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="coach@swimclub.ca" /></label> : <><label>New password<span className="sc-account-password"><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={10} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="10+ characters" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label><label>Repeat new password<input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={10} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} aria-invalid={Boolean(confirmPassword && password !== confirmPassword)} /></label><p className={`sc-account-password-note ${confirmPassword && password !== confirmPassword ? "is-error" : ""}`}><ShieldCheck /> {confirmPassword ? password === confirmPassword ? "Passwords match." : "Passwords do not match yet." : "Use 10+ characters with uppercase, lowercase, and a number."}</p></>}</fieldset>
          {error && <div className="sc-account-error" role="alert">{error}</div>}
          <button className="sc-account-submit" type="submit" disabled={pending}>{pending ? "Please wait…" : isForgot ? "Send reset link" : "Reset password"}<ArrowRight /></button>
        </form>}
        {!success && <p className="sc-account-switch">Remembered it? <Link href="/login">Return to login</Link></p>}
      </div></section>
    </main>
  );
}
