import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_HREF } from "../siteDetails";

export default function PublicPageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="sc-public-page">
      <a className="sc-skip-link" href="#main-content">Skip to content</a>
      <header className="sc-public-nav">
        <Link className="sc-landing-logo" href="/" aria-label="LaneLab home">
          <span className="sc-landing-logo-mark" aria-hidden="true"><span /><span /><span /></span>
          <span><strong>LaneLab</strong><small>Swim performance studio</small></span>
        </Link>
        <nav aria-label="Public pages">
          <Link href="/">Home</Link>
          <Link href="/#platform">Platform</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div>
          <Link className="sc-public-login" href="/login">Log in</Link>
          <Link className="sc-landing-button sc-landing-button-primary" href="/signup">Sign up <ArrowRight /></Link>
        </div>
      </header>
      <div id="main-content">{children}</div>
      <footer className="sc-public-footer">
        <div>
          <Link className="sc-landing-logo" href="/"><span className="sc-landing-logo-mark" aria-hidden="true"><span /><span /><span /></span><span><strong>LaneLab</strong><small>Swim performance studio</small></span></Link>
          <p>Purpose-built workout design and race intelligence for competitive swimming.</p>
        </div>
        <div><strong>Product</strong><Link href="/#platform">Platform</Link><Link href="/login">Log in</Link><Link href="/signup">Sign up</Link></div>
        <div><strong>Trust</strong><Link href="/terms">Terms of Service</Link><Link href="/privacy">Privacy Policy</Link><Link href="/contact">Contact</Link></div>
        <div><strong>Contact</strong><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a><a href={`tel:${SUPPORT_PHONE_HREF}`}>{SUPPORT_PHONE}</a></div>
        <small>© 2026 LaneLab. Coaches remain responsible for athlete suitability and final practice decisions.</small>
      </footer>
    </main>
  );
}

