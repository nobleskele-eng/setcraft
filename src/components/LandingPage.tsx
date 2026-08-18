"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

function accentA(pct: number): string {
  return `color-mix(in oklch, var(--color-accent) ${pct}%, transparent)`;
}

function surfaceA(pct: number): string {
  return `color-mix(in oklch, var(--color-surface) ${pct}%, transparent)`;
}

const railCenter = "calc(var(--landing-rail-width) / 2)";

const PILLARS = [
  {
    step: "01",
    title: "Deterministic math",
    copy: "The engine computes totals, feasibility, send-off vs. target time, warm-up and booking checks directly. AI never overrides a validated calculation.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-active)" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18"></rect>
        <line x1="4" y1="8" x2="20" y2="8"></line>
        <line x1="9" y1="12" x2="9" y2="12.01"></line>
        <line x1="13" y1="12" x2="13" y2="12.01"></line>
        <line x1="17" y1="12" x2="17" y2="12.01"></line>
        <line x1="9" y1="16" x2="9" y2="16.01"></line>
        <line x1="13" y1="16" x2="13" y2="16.01"></line>
        <line x1="17" y1="16" x2="17" y2="16.01"></line>
      </svg>
    ),
  },
  {
    step: "02",
    title: "Provenance on every split",
    copy: "Every checkpoint is labeled Official, Secondary or Estimated. An estimated value is never presented as an official one, on screen or in the PDF.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-active)" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <path d="M12 3 L20 6 V12 C20 16.5 16.5 19.5 12 21 C7.5 19.5 4 16.5 4 12 V6 Z"></path>
        <polyline points="9,12 11.5,14.5 15.5,10.5"></polyline>
      </svg>
    ),
  },
  {
    step: "03",
    title: "Block-language authoring",
    copy: "Structured practice sets in a block language with containers and presets, plus a Quick Write parser for the coach notation you already use on paper.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-active)" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <rect x="3" y="4" width="18" height="4"></rect>
        <rect x="3" y="10" width="12" height="4"></rect>
        <rect x="3" y="16" width="15" height="4"></rect>
      </svg>
    ),
  },
  {
    step: "04",
    title: "Local first, coach owned",
    copy: "Projects, drafts, custom blocks and calendar plans live in the browser. No forced accounts, manual export and import, limits are explained rather than hidden.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-active)" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <rect x="3" y="4" width="18" height="7"></rect>
        <rect x="3" y="13" width="18" height="7"></rect>
        <line x1="7" y1="7.5" x2="7" y2="7.51"></line>
        <line x1="7" y1="16.5" x2="7" y2="16.51"></line>
      </svg>
    ),
  },
  {
    step: "05",
    title: "Optional AI second opinion",
    copy: "A Gemini-backed copilot for interpretation, with a labeled offline fallback when no key is configured. It cannot rewrite records, standards, points or provenance.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-active)" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <path d="M12 3 L13.5 8.5 L19 10 L13.5 11.5 L12 17 L10.5 11.5 L5 10 L10.5 8.5 Z"></path>
        <path d="M18 16 L18.8 18.2 L21 19 L18.8 19.8 L18 22 L17.2 19.8 L15 19 L17.2 18.2 Z"></path>
      </svg>
    ),
  },
];

export default function LandingPage() {
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scrubber = scrubberRef.current;
    if (!scrubber) return;
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      const top = ratio * window.innerHeight;
      scrubber.style.top = `${Math.max(0, Math.min(window.innerHeight - 24, top))}px`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const cells = Array.from(document.querySelectorAll<HTMLElement>(".sc-pillar-cell"));
    if (!cells.length) return;

    const reveal = (el: HTMLElement) => {
      if (el.getAttribute("data-in") === "true") return;
      const step = parseInt(el.getAttribute("data-step") || "1", 10);
      window.setTimeout(() => el.setAttribute("data-in", "true"), (step - 1) * 60);
    };

    if (!("IntersectionObserver" in window)) {
      cells.forEach((c) => c.setAttribute("data-in", "true"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target as HTMLElement);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    cells.forEach((c) => {
      io.observe(c);
      const r = c.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) reveal(c);
    });
    const fallback = window.setTimeout(() => cells.forEach((c) => reveal(c)), 1500);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", paddingLeft: "var(--landing-rail-width)", paddingTop: "var(--landing-nav-height)", position: "relative" }}>
      {/* Timeline spine */}
      <aside aria-label="Timeline spine" style={{ position: "fixed", left: 0, top: 0, width: "var(--landing-rail-width)", height: "100vh", background: "var(--color-surface)", zIndex: 40, fontFamily: "var(--font-mono)" }}>
        <div aria-hidden="true" style={{ position: "absolute", left: railCenter, top: "var(--space-6)", bottom: "var(--space-6)", width: 1, background: "var(--color-accent)" }} />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `calc(${railCenter} - 6px)`,
            top: "var(--space-6)",
            bottom: "var(--space-6)",
            width: "var(--space-3)",
            backgroundImage: "linear-gradient(to bottom, var(--color-accent) 1px, transparent 1px)",
            backgroundSize: "100% var(--space-9)",
            backgroundPosition: "0 0",
            opacity: 0.65,
          }}
        />

        <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: "var(--landing-rail-label-top)", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro-2xs)", color: "var(--color-accent)", letterSpacing: "0.14em" }}>00:00</div>

        <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: "var(--space-6)", bottom: "var(--space-6)", pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro-2xs)", letterSpacing: "0.15em", color: "var(--color-ink-muted)" }}>
          <span style={{ position: "absolute", left: 0, right: railCenter, top: 0, textAlign: "right", paddingRight: "var(--space-2)", transform: "translateY(-4px)" }}>01</span>
          <span style={{ position: "absolute", left: 0, right: railCenter, top: "25%", textAlign: "right", paddingRight: "var(--space-2)" }}>02</span>
          <span style={{ position: "absolute", left: 0, right: railCenter, top: "50%", textAlign: "right", paddingRight: "var(--space-2)" }}>03</span>
          <span style={{ position: "absolute", left: 0, right: railCenter, top: "75%", textAlign: "right", paddingRight: "var(--space-2)" }}>04</span>
        </div>

        <div ref={scrubberRef} aria-hidden="true" style={{ position: "absolute", left: "var(--space-5)", top: "var(--space-6)", width: "var(--space-5)", height: "var(--space-5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, willChange: "top", filter: `drop-shadow(0 0 6px ${accentA(35)})` }}>
          <div style={{ position: "absolute", inset: 0, border: "1px solid var(--color-accent)" }} />
          <div style={{ position: "absolute", top: -1, left: -1, width: 5, height: 1, background: "var(--color-accent)" }} />
          <div style={{ position: "absolute", top: -1, left: -1, width: 1, height: 5, background: "var(--color-accent)" }} />
          <div style={{ position: "absolute", top: -1, right: -1, width: 5, height: 1, background: "var(--color-accent)" }} />
          <div style={{ position: "absolute", top: -1, right: -1, width: 1, height: 5, background: "var(--color-accent)" }} />
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 5, height: 1, background: "var(--color-accent)" }} />
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 1, height: 5, background: "var(--color-accent)" }} />
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 5, height: 1, background: "var(--color-accent)" }} />
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 1, height: 5, background: "var(--color-accent)" }} />
          <div style={{ width: "var(--space-2)", height: "var(--space-2)", background: "var(--color-accent)" }} />
        </div>
      </aside>

      {/* Top nav */}
      <nav className="sc-nav" style={{ position: "fixed", top: 0, left: "var(--landing-rail-width)", right: 0, zIndex: 39, height: "var(--landing-nav-height)" }}>
        <span className="sc-nav-brand">SetCraft</span>
        <span className="sc-nav-spacer" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", color: "var(--color-ink-muted)", letterSpacing: "0.08em" }}>BAR 01 / 04</span>
        <Link className="sc-nav-item" href="/login">Log in</Link>
        <Link className="sc-btn" data-variant="primary" data-size="sm" href="/studio" role="button">Open Swim Studio</Link>
      </nav>

      {/* BAR 01 — INTRO */}
      <section id="bar-01" aria-labelledby="bar-01-title" style={{ position: "relative", background: "var(--color-surface)", color: "var(--color-ink)", minHeight: "calc(100vh - var(--landing-nav-height))", padding: "var(--space-9) var(--space-8) var(--space-10) var(--space-10)", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "var(--color-accent)", opacity: 0.3 }} />
        <div style={{ position: "absolute", top: "var(--landing-rail-label-top)", left: "var(--space-5)", fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", letterSpacing: "0.1em", color: "var(--color-accent)", opacity: 0.75 }}>BAR 01 – INTRO</div>
        <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "var(--space-5)", transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "left center", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.18em", color: "var(--color-ink-muted)" }}>BAR 01 – INTRO</div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)", gap: "var(--space-8)", alignItems: "center", maxWidth: "var(--landing-max-width)" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", letterSpacing: "0.14em", color: "var(--color-accent)", marginBottom: "var(--landing-eyebrow-gap)" }}>// BAR 01 / INTRO</div>
            <h1 id="bar-01-title" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(3rem, 6vw, 5rem)", lineHeight: 0.98, letterSpacing: "-0.015em", color: "var(--color-ink)", margin: "0 0 var(--space-5)" }}>
              <span className="sc-hero-h1-clip"><span className="sc-hero-h1-inner">Write the practice.</span></span>
              <span className="sc-hero-h1-clip"><span className="sc-hero-h1-inner" style={{ animationDelay: "0.08s" }}>Read the race.</span></span>
              <span className="sc-hero-h1-clip"><span className="sc-hero-h1-inner" style={{ animationDelay: "0.16s", color: "var(--color-accent)" }}>On one deck.</span></span>
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-lg)", lineHeight: 1.55, color: "var(--color-ink-muted)", maxWidth: "var(--landing-copy-max-width-sm)", margin: "0 0 var(--space-6)" }}>
              SetCraft is a coach-oriented workspace for authoring structured practice sets and reading race performance against official World Aquatics data. Deterministic math is the source of truth; every derived value carries visible provenance.
            </p>
            <Link className="sc-btn" data-variant="primary" data-size="lg" href="/studio" role="button">Open Swim Studio</Link>
          </div>

          <div aria-hidden="true" style={{ justifySelf: "end", alignSelf: "center", width: "100%", maxWidth: "var(--landing-visual-max-width)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "var(--space-1)", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.08em", color: "var(--color-ink-muted)", marginBottom: "var(--space-2)" }}>
              {["01", "02", "03", "04", "05", "06", "07", "08"].map((n) => <span key={n} style={{ textAlign: "center" }}>{n}</span>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "var(--space-1)" }}>
              {[true, false, false, true, false, false, true, false].map((filled, i) => (
                <div key={i} style={{ aspectRatio: "1", border: `1px solid ${accentA(40)}`, background: filled ? accentA(60) : undefined }} />
              ))}
            </div>
            <div style={{ marginTop: "var(--space-3)", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.08em", color: "var(--color-ink-muted)" }}>
              <span>PATTERN 03 / 08</span>
              <span>1 BAR</span>
            </div>
          </div>
        </div>
      </section>

      {/* BAR 02 — STEPS */}
      <section id="bar-02" aria-labelledby="bar-02-title" style={{ position: "relative", background: "var(--color-canvas)", color: "var(--color-ink-on-canvas)", padding: "var(--space-11) var(--space-8) var(--space-11) var(--space-10)", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "var(--color-accent)", opacity: 0.3 }} />
        <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "var(--space-5)", transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "left center", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.18em", color: "var(--color-ink-muted-on-canvas)" }}>BAR 02 – STEPS</div>

        <div style={{ maxWidth: "var(--landing-max-width)", margin: "0 auto var(--space-6)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", letterSpacing: "0.14em", color: "var(--color-accent-active)", marginBottom: "var(--space-3)" }}>// FIVE STEPS TO A BAR</div>
          <h2 id="bar-02-title" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2rem, 3.6vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.01em", margin: 0, color: "var(--color-ink-on-canvas)", maxWidth: "var(--landing-copy-max-width-md)" }}>
            The product is five deliberate steps.
          </h2>
        </div>

        <div style={{ maxWidth: "var(--landing-max-width)", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.12em", color: "var(--color-ink-muted-on-canvas)", marginBottom: "var(--space-2)" }}>
            {PILLARS.map((p) => <span key={p.step}>STEP {p.step}</span>)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, border: `1px solid ${accentA(50)}`, background: "var(--color-canvas-raised)" }}>
            {PILLARS.map((p, i) => (
              <article
                key={p.step}
                className="sc-pillar-cell"
                data-step={i + 1}
                style={{
                  borderRight: i < PILLARS.length - 1 ? `1px solid ${accentA(50)}` : undefined,
                  padding: "var(--landing-pillar-pad-y) var(--space-5)",
                  minHeight: "var(--landing-pillar-min-height)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--landing-pillar-icon-gap)" }}>
                  {p.icon}
                  {i > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", letterSpacing: "0.12em", color: "var(--color-ink-muted-on-canvas)" }}>{p.step}</span>}
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-display-sm)", lineHeight: 1.1, letterSpacing: "-0.005em", margin: "0 0 var(--space-3)" }}>{p.title}</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-sm)", lineHeight: 1.55, color: "var(--color-ink-muted-on-canvas)", margin: 0 }}>{p.copy}</p>
              </article>
            ))}
          </div>

          <div aria-hidden="true" style={{ position: "relative", height: "var(--space-5)", marginTop: -1, background: "var(--color-canvas-sunken)", border: `1px solid ${accentA(50)}`, borderTop: "none" }}>
            <div style={{ position: "absolute", inset: "5px 0", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ background: accentA(40), borderRight: i < 4 ? `1px solid ${accentA(50)}` : undefined }} />
              ))}
            </div>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent calc(100% / 16 - 1px), ${surfaceA(35)} calc(100% / 16 - 1px), ${surfaceA(35)} calc(100% / 16))`, pointerEvents: "none" }} />
          </div>
          <div style={{ marginTop: "var(--space-2)", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.1em", color: "var(--color-ink-muted-on-canvas)" }}>
            <span>BEAT 01</span><span>BEAT 05</span><span>BEAT 09</span><span>BEAT 13</span><span style={{ textAlign: "right" }}>BEAT 16</span>
          </div>
        </div>
      </section>

      {/* BAR 03 — BRIDGE */}
      <section id="bar-03" aria-labelledby="bar-03-title" style={{ position: "relative", background: "var(--color-canvas-sunken)", color: "var(--color-ink-on-canvas)", padding: "var(--space-10) var(--space-8) var(--space-10) var(--space-10)", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "var(--color-accent)", opacity: 0.3 }} />
        <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "var(--space-5)", transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "left center", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.18em", color: "var(--color-ink-muted-on-canvas)" }}>BAR 03 – BRIDGE</div>

        <div style={{ maxWidth: "var(--landing-max-width-narrow)", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", letterSpacing: "0.16em", color: "var(--color-accent-active)", opacity: 0.6, marginBottom: "var(--space-5)" }}>// BRIDGE</div>
          <p id="bar-03-title" style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-lg)", lineHeight: 1.55, color: "var(--color-ink-on-canvas)", margin: 0 }}>
            Race Intelligence uses official 2026 World Aquatics points, current LCM world records checked against World Aquatics as of 4 August 2026, and exact-age standards. 4,854 selected non-record reference races. 31,842 official checkpoints across LCM, SCM and SCY. Records, standards and points are locked facts.
          </p>
        </div>
      </section>

      {/* BAR 04 — OUTRO */}
      <section id="bar-04" aria-labelledby="bar-04-title" style={{ position: "relative", background: "var(--color-surface)", color: "var(--color-ink)", padding: "var(--space-11) var(--space-8) var(--space-11) var(--space-10)", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "var(--color-accent)", opacity: 0.3 }} />
        <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "var(--space-5)", transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "left center", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.18em", color: "var(--color-ink-muted)" }}>BAR 04 – OUTRO</div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)", gap: "var(--space-8)", alignItems: "center", maxWidth: "var(--landing-max-width)" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", letterSpacing: "0.14em", color: "var(--color-accent)", marginBottom: "var(--landing-eyebrow-gap)" }}>// BAR 04 / OUTRO</div>
            <h2 id="bar-04-title" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.0, letterSpacing: "-0.015em", color: "var(--color-ink)", margin: "0 0 var(--space-5)", maxWidth: "var(--landing-copy-max-width-md)" }}>
              Open the deck. The bar is complete.
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-lg)", lineHeight: 1.55, color: "var(--color-ink-muted)", maxWidth: "var(--landing-visual-max-width)", margin: "0 0 var(--space-6)" }}>
              Write the practice, run the race, hand off the deck sheet. No account required to start.
            </p>
            <Link className="sc-btn" data-variant="primary" data-size="lg" href="/studio" role="button">Open Swim Studio</Link>
          </div>

          <div aria-hidden="true" style={{ justifySelf: "end", alignSelf: "center", width: "100%", maxWidth: "var(--landing-visual-max-width)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "var(--space-1)", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.08em", color: "var(--color-ink-muted)", marginBottom: "var(--space-2)" }}>
              {["01", "02", "03", "04", "05", "06", "07", "08"].map((n) => <span key={n} style={{ textAlign: "center" }}>{n}</span>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "var(--space-1)" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1", border: `1px solid ${accentA(40)}`, background: accentA(60) }} />
              ))}
            </div>
            <div style={{ marginTop: "var(--space-3)", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "var(--landing-text-micro)", letterSpacing: "0.08em", color: "var(--color-ink-muted)" }}>
              <span>PATTERN 08 / 08</span>
              <span>BAR COMPLETE</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="sc-nav" style={{ height: "auto", padding: "var(--landing-eyebrow-gap) var(--space-4)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <span className="sc-nav-brand">SetCraft</span>
        <Link className="sc-nav-item" href="/studio">Studio</Link>
        <Link className="sc-nav-item" href="/studio">Race Intelligence</Link>
        <Link className="sc-nav-item" href="/studio">Calculators</Link>
        <span className="sc-nav-item" aria-disabled="true" style={{ cursor: "default", opacity: 0.5 }}>Docs</span>
        <span className="sc-nav-spacer" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", color: "var(--color-ink-muted)", letterSpacing: "0.08em" }}>v13 – PERFORMANCE INTELLIGENCE</span>
      </footer>
    </div>
  );
}
