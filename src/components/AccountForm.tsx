"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Waves } from "lucide-react";
import Link from "next/link";

type Mode = "login" | "signup";

export default function AccountForm({ mode }: { mode: Mode }) {
  const isLogin = mode === "login";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({})) as { error?: string; redirect?: string };
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      window.location.assign(data.redirect || "/studio");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <main className="sc-account-page">
      <section className="sc-account-visual" aria-label="SetCraft product introduction">
        <Link className="sc-account-back" href="/"><ArrowLeft /> Back to SetCraft</Link>
        <div className="sc-account-visual-content">
          <span className="sc-account-icon"><Waves /></span>
          <p className="sc-account-overline">The complete coaching workspace</p>
          <h1>{isLogin ? "Welcome back to the work behind the work." : "Build a better system around every swimmer."}</h1>
          <p>{isLogin ? "Your projects, season plans, race work, and deck sheets are ready where you left them." : "Set up your coaching profile once, then move from session design to lane delivery without changing tools."}</p>
          <div className="sc-account-mini-workout" aria-hidden="true">
            <header><span>TUESDAY · SCM</span><strong>Quality aerobic</strong></header>
            <div><small>WARM-UP</small><b>4 × 100 Choice</b><em>@ 1:40</em></div>
            <div><small>DRILL</small><b>8 × 50 Free</b><em>@ 1:00</em></div>
            <div><small>MAIN</small><b>3 × (4 × 100)</b><em>@ 1:25</em></div>
          </div>
        </div>
        <p className="sc-account-visual-foot">LCM · SCM · SCY <span /> Workout design · Race intelligence</p>
      </section>

      <section className="sc-account-form-side">
        <div className="sc-account-form-wrap">
          <Link className="sc-account-logo" href="/" aria-label="SetCraft home"><span className="sc-landing-logo-mark" aria-hidden="true"><span /><span /><span /></span><strong>SetCraft</strong></Link>
          <div className="sc-account-heading">
            <p>{isLogin ? "Secure account access" : "Create your workspace"}</p>
            <h2>{isLogin ? "Log in to SetCraft" : "Tell us about your coaching world"}</h2>
            <span>{isLogin ? "Use the email and password attached to your SetCraft account." : "Start with your account details. Club information helps personalize the workspace and can be updated later."}</span>
          </div>

          <form className="sc-account-form" onSubmit={submit}>
            {!isLogin && (
              <>
                <fieldset>
                  <legend><span>01</span> Account details</legend>
                  <div className="sc-account-field-row">
                    <label>Full name<input name="fullName" autoComplete="name" required minLength={2} maxLength={100} placeholder="Taylor Coach" /></label>
                    <label>Phone <small>Optional</small><input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="(416) 555-0184" /></label>
                  </div>
                </fieldset>
              </>
            )}

            <fieldset>
              {!isLogin && <legend><span>02</span> Login credentials</legend>}
              <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="coach@swimclub.ca" /></label>
              <label>
                Password
                <span className="sc-account-password">
                  <input name="password" type={showPassword ? "text" : "password"} autoComplete={isLogin ? "current-password" : "new-password"} required minLength={isLogin ? undefined : 10} maxLength={128} placeholder={isLogin ? "Enter your password" : "10+ characters"} />
                  <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button>
                </span>
              </label>
              {!isLogin && <p className="sc-account-password-note"><LockKeyhole /> Use 10+ characters with uppercase, lowercase, and a number.</p>}
            </fieldset>

            {!isLogin && (
              <fieldset>
                <legend><span>03</span> Club profile <small>Optional</small></legend>
                <div className="sc-account-field-row">
                  <label>Swim club<input name="clubName" maxLength={120} placeholder="North Shore Aquatics" /></label>
                  <label>Your role<select name="clubRole" defaultValue=""><option value="">Select a role</option><option>Head coach</option><option>Assistant coach</option><option>Age-group coach</option><option>Swimmer</option><option>Performance director</option><option>Other</option></select></label>
                </div>
                <div className="sc-account-field-row">
                  <label>Club city<input name="clubCity" maxLength={120} placeholder="Toronto, ON" /></label>
                  <label>Primary course<select name="clubCourse" defaultValue=""><option value="">Select a course</option><option value="LCM">LCM — 50 m</option><option value="SCM">SCM — 25 m</option><option value="SCY">SCY — 25 yd</option><option value="Multiple">Multiple courses</option></select></label>
                </div>
                <label className="sc-account-consent"><input type="checkbox" required /> <span>I agree to use SetCraft responsibly and confirm that coaches remain responsible for athlete suitability and final practice decisions.</span></label>
              </fieldset>
            )}

            {error && <div className="sc-account-error" role="alert">{error}</div>}
            <button className="sc-account-submit" type="submit" disabled={pending}>{pending ? "Please wait…" : isLogin ? "Log in to SetCraft" : "Create my workspace"}<ArrowRight /></button>
          </form>

          <p className="sc-account-switch">{isLogin ? "New to SetCraft?" : "Already have an account?"} <a href={isLogin ? "/signup" : "/login"}>{isLogin ? "Create an account" : "Log in"}</a></p>
          <div className="sc-account-security"><ShieldCheck /><span><strong>Secure by design</strong><small>Passwords are salted and hashed. Sessions use secure, private cookies.</small></span></div>
        </div>
      </section>
    </main>
  );
}
