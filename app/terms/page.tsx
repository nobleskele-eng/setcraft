import type { Metadata } from "next";
import PublicPageFrame from "../../src/components/PublicPageFrame";
import { LEGAL_EFFECTIVE_DATE, SUPPORT_EMAIL, SUPPORT_LOCATION } from "../../src/siteDetails";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <PublicPageFrame>
      <article className="sc-legal-page">
        <header className="sc-legal-hero">
          <p>Trust centre · Legal</p>
          <h1>Terms of<br />Service</h1>
          <div><span>Effective {LEGAL_EFFECTIVE_DATE}</span><span>SetCraft Swim Studio</span></div>
        </header>
        <div className="sc-legal-layout">
          <aside aria-label="Terms contents">
            <strong>On this page</strong>
            <a href="#acceptance">Acceptance</a><a href="#accounts">Accounts</a><a href="#coaching">Coaching responsibility</a><a href="#ai">AI and images</a><a href="#content">Your content</a><a href="#conduct">Acceptable use</a><a href="#availability">Availability</a><a href="#liability">Disclaimers</a><a href="#contact">Contact</a>
          </aside>
          <div className="sc-legal-copy">
            <section className="sc-legal-summary"><strong>Plain-language summary</strong><p>SetCraft is a planning and decision-support workspace. It does not replace qualified coaching, medical advice, governing-body rules, or the user’s responsibility to check every workout and AI-assisted output before use.</p></section>
            <section id="acceptance"><span>01</span><h2>Acceptance and scope</h2><p>These Terms govern access to and use of the SetCraft website, coaching workspace, race-intelligence tools, AI features, exports, and related services (the “Service”). By creating an account or using the Service, you agree to these Terms and the <a href="/privacy">Privacy Policy</a>. If you use SetCraft for a club or organization, you confirm that you have authority to accept these Terms for that organization.</p></section>
            <section id="accounts"><span>02</span><h2>Accounts and security</h2><p>You must provide accurate account information, keep your password confidential, and promptly tell us about suspected unauthorized use. You are responsible for activity under your account. Do not share credentials or attempt to access another person’s account.</p><p>SetCraft is intended for coaches, club staff, and athletes capable of understanding these Terms. A minor may use the Service only with appropriate parent, guardian, coach, and club authorization.</p></section>
            <section id="coaching"><span>03</span><h2>Coaching and athlete responsibility</h2><p>Training plans, pace calculations, race analysis, equipment suggestions, and technique cues are informational tools. A qualified coach must assess the athlete, pool conditions, supervision, medical restrictions, readiness, intervals, recovery, and governing-body requirements before assigning or changing training.</p><p>SetCraft is not a medical device and does not provide diagnosis, treatment, return-to-sport clearance, or emergency advice. Stop and seek appropriate professional help when health or safety may be at risk.</p></section>
            <section id="ai"><span>04</span><h2>AI-assisted features and image review</h2><p>AI output may be incomplete, inaccurate, or unsuitable for a particular swimmer. You must review it before relying on it. Never treat AI output as an official record, meet-entry time, medical conclusion, or independent readiness decision.</p><p>When uploading an image, you confirm that you have permission to use it and to submit it for AI processing. Do not upload private medical records, government identifiers, explicit content, or an identifiable image of a minor without appropriate authorization. Image review supports coaching observation; it must not be used for identity recognition, sensitive-trait inference, diagnosis, or injury assessment.</p></section>
            <section id="content"><span>05</span><h2>Your content</h2><p>You retain ownership of workout text, athlete context, images, and other material you submit. You grant SetCraft a limited permission to process that content only as needed to operate, secure, and improve the requested Service. You are responsible for ensuring your content is lawful, accurate, and appropriately authorized.</p><p>AI prompts and images may be sent to configured technology providers to produce the requested response, as described in our Privacy Policy.</p></section>
            <section id="conduct"><span>06</span><h2>Acceptable use</h2><p>You may not misuse the Service, bypass access controls, introduce malicious code, probe other accounts, scrape the Service at disruptive volume, upload unlawful or infringing content, impersonate another person, or use SetCraft to facilitate harm, discrimination, surveillance, or unauthorized profiling.</p><p>You may not represent AI-generated material as an official governing-body result or knowingly use SetCraft output in a way that endangers an athlete.</p></section>
            <section><span>07</span><h2>SetCraft materials</h2><p>The Service design, software, branding, and original materials are owned by SetCraft or its licensors and are protected by applicable intellectual-property laws. These Terms give you a limited, revocable, non-transferable right to use the Service for its intended purpose; they do not transfer ownership.</p></section>
            <section id="availability"><span>08</span><h2>Service availability and changes</h2><p>We may update, suspend, or discontinue features to maintain security, quality, or legal compliance. We aim for reliable service but do not guarantee uninterrupted availability, permanent storage, or compatibility with every device. Keep appropriate copies of important deck sheets, plans, and records.</p><p>We may suspend accounts involved in material misuse, security threats, or repeated violations, subject to applicable law.</p></section>
            <section id="liability"><span>09</span><h2>Disclaimers and limits</h2><p>To the extent permitted by law, the Service is provided “as is” and “as available,” without warranties that every output will be accurate or fit for a particular purpose. SetCraft is not responsible for coaching decisions, athlete outcomes, injuries, missed entries, or losses caused by reliance on unreviewed output.</p><p>Nothing in these Terms excludes rights or liabilities that cannot lawfully be excluded. To the extent permitted by law, SetCraft’s aggregate liability connected with the Service will not exceed the amount you paid SetCraft in the 12 months before the event giving rise to the claim.</p></section>
            <section><span>10</span><h2>Governing law and updates</h2><p>These Terms are governed by the laws of Ontario and the federal laws of Canada applicable there, without regard to conflict-of-law principles. Courts located in Ontario will have jurisdiction unless applicable consumer law requires otherwise.</p><p>We may update these Terms as the Service changes. We will post the revised date and provide additional notice when a material change requires it.</p></section>
            <section id="contact"><span>11</span><h2>Contact</h2><p>Questions about these Terms can be sent to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Placeholder mailing location: {SUPPORT_LOCATION}.</p></section>
          </div>
        </div>
      </article>
    </PublicPageFrame>
  );
}

