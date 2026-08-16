import type { Metadata } from "next";
import { Clock3, LifeBuoy, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import PublicPageFrame from "../../src/components/PublicPageFrame";
import { SUPPORT_EMAIL, SUPPORT_LOCATION, SUPPORT_PHONE, SUPPORT_PHONE_HREF } from "../../src/siteDetails";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PublicPageFrame>
      <section className="sc-contact-page">
        <div className="sc-contact-intro"><p>SetCraft support</p><h1>Start with the<br />right lane.</h1><span>Questions about accounts, product workflows, club setup, privacy, or partnerships are welcome. Never send a password, athlete medical record, or other highly sensitive information by email.</span></div>
        <div className="sc-contact-grid">
          <a href={`mailto:${SUPPORT_EMAIL}`}><Mail /><span><small>Email</small><strong>{SUPPORT_EMAIL}</strong><em>Best for product and account questions</em></span></a>
          <a href={`tel:${SUPPORT_PHONE_HREF}`}><Phone /><span><small>Phone</small><strong>{SUPPORT_PHONE}</strong><em>Placeholder North American support line</em></span></a>
          <div><MapPin /><span><small>Location</small><strong>{SUPPORT_LOCATION}</strong><em>Placeholder business location</em></span></div>
          <div><Clock3 /><span><small>Response target</small><strong>Within 2 business days</strong><em>Monday–Friday, Eastern Time</em></span></div>
        </div>
        <div className="sc-contact-support-cards"><article><LifeBuoy /><strong>Product support</strong><p>Include the page name, what you expected, and what happened. Screenshots help, but remove athlete-identifying details first.</p></article><article><ShieldCheck /><strong>Privacy requests</strong><p>Use the subject “Privacy request” for access, correction, deletion, or questions about account and AI data handling.</p></article></div>
      </section>
    </PublicPageFrame>
  );
}
