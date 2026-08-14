"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  ClipboardList,
  LockKeyhole,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

type AuthMode = "login" | "signup";

const AUTH_PATH = "/signin-with-chatgpt?return_to=%2F";

const capabilities = [
  {
    number: "01",
    title: "Build the practice",
    detail: "Structure blocks, lane versions, intervals and deck-ready notes.",
    icon: ClipboardList,
  },
  {
    number: "02",
    title: "Read the race",
    detail: "Compare splits, course context and execution without losing provenance.",
    icon: TimerReset,
  },
  {
    number: "03",
    title: "Keep the coaching call",
    detail: "Use AI as an assistant while the coach owns every final decision.",
    icon: ShieldCheck,
  },
];

export default function AuthGate() {
  const [mode, setMode] = useState<AuthMode>("login");
  const isLogin = mode === "login";

  return (
    <main className="sc-auth-shell">
      <section className="sc-auth-story" aria-labelledby="auth-product-title">
        <div className="sc-auth-brand">
          <span className="sc-auth-mark" aria-hidden="true"><span /><span /><span /></span>
          <div>
            <p className="sc-auth-brand-name">SetCraft</p>
            <p className="sc-auth-brand-tag">Swim performance studio</p>
          </div>
        </div>

        <div className="sc-auth-story-body">
          <p className="sc-auth-overline">Built for the work behind every good session</p>
          <h1 id="auth-product-title" className="sc-auth-title">
            Plan the session.<br />
            <span>Own the details.</span>
          </h1>
          <p className="sc-auth-lede">
            One disciplined workspace for training design, lane planning, race analysis and pool-deck delivery.
          </p>

          <div className="sc-auth-capabilities">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.number} className="sc-auth-capability">
                  <span className="sc-auth-capability-number">{item.number}</span>
                  <span className="sc-auth-capability-icon"><Icon aria-hidden="true" /></span>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.detail}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="sc-auth-course-line" aria-label="Supported course formats">
          <span>LCM</span><span>SCM</span><span>SCY</span><span className="sc-auth-course-rule" />
          <small>Built for coaches and competitive swimmers</small>
        </div>
      </section>

      <section className="sc-auth-access" aria-label="SetCraft account access">
        <div className="sc-auth-access-inner">
          <div className="sc-auth-lock" aria-hidden="true"><LockKeyhole /></div>
          <p className="sc-auth-panel-kicker">Secure workspace</p>
          <h2 className="sc-auth-panel-title">{isLogin ? "Welcome back." : "Create your workspace."}</h2>
          <p className="sc-auth-panel-copy">
            {isLogin
              ? "Verify your identity to open the complete SetCraft studio."
              : "Use one secure identity for your SetCraft workspace—no separate password to remember."}
          </p>

          <div className="sc-auth-tabs" role="tablist" aria-label="Account action">
            <button type="button" role="tab" aria-selected={isLogin} data-active={isLogin ? "true" : "false"} onClick={() => setMode("login")}>Log in</button>
            <button type="button" role="tab" aria-selected={!isLogin} data-active={!isLogin ? "true" : "false"} onClick={() => setMode("signup")}>Sign up</button>
          </div>

          <div className="sc-auth-panel-body" role="tabpanel">
            {!isLogin && (
              <ul className="sc-auth-benefits">
                {["Complete Swim Studio and project hub", "Race analysis, strategy and conversion tools", "Coach AI grounded in approved SetCraft knowledge"].map((benefit) => (
                  <li key={benefit}><Check aria-hidden="true" />{benefit}</li>
                ))}
              </ul>
            )}

            <a className="sc-auth-primary" href={AUTH_PATH}>
              <span>{isLogin ? "Continue to secure login" : "Create my SetCraft account"}</span>
              <ArrowRight aria-hidden="true" />
            </a>

            <p className="sc-auth-identity-note">
              {isLogin
                ? "SetCraft remains locked until your identity is verified."
                : "Account verification is completed securely through ChatGPT. SetCraft never receives or stores your password."}
            </p>
          </div>

          <div className="sc-auth-trust">
            <ShieldCheck aria-hidden="true" />
            <span>Protected access</span>
            <span className="sc-auth-trust-rule" />
            <small>Session identity managed by ChatGPT</small>
          </div>
        </div>
      </section>
    </main>
  );
}
