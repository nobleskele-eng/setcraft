import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Gauge,
  Layers3,
  Mail,
  Phone,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import Link from "next/link";
import type { AppUser } from "../../app/auth";
import LandingLaneRope from "./LandingLaneRope";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_HREF } from "../siteDetails";

const heroImage = "https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&fm=jpg&q=82&w=2200";
const poolImage = "https://images.unsplash.com/photo-1560090964-cc7c8bfb293e?auto=format&fit=crop&fm=jpg&q=82&w=1800";

const productAreas = [
  {
    eyebrow: "Plan",
    title: "Build sets visually, without losing coaching intent.",
    copy: "Compose sections, repeats, recovery, equipment, intensity, nested conditions, and lane variants in one structured canvas.",
    icon: Layers3,
    tone: "aqua",
  },
  {
    eyebrow: "Deliver",
    title: "Turn one session into a lane-ready deck sheet.",
    copy: "Assign groups, set realistic send-offs, create pace versions, validate totals, and export a clean practice sheet for deck.",
    icon: ClipboardCheck,
    tone: "green",
  },
  {
    eyebrow: "Analyze",
    title: "Read races with the evidence still attached.",
    copy: "Compare LCM, SCM, and SCY performances using clear split labels, official references, and coach-controlled AI explanation.",
    icon: BarChart3,
    tone: "orange",
  },
  {
    eyebrow: "Develop",
    title: "See the week, month, season, and athlete context.",
    copy: "Map training phases, review load over time, and keep planning connected to the season instead of isolated spreadsheets.",
    icon: CalendarDays,
    tone: "violet",
  },
];

export default function LandingPage({ user }: { user: AppUser | null }) {
  return (
    <main className="sc-landing">
      <LandingLaneRope />
      <a className="sc-skip-link" href="#main-content">Skip to content</a>
      <header className="sc-landing-nav">
        <Link className="sc-landing-logo" href="/" aria-label="SetCraft home">
          <span className="sc-landing-logo-mark" aria-hidden="true"><span /><span /><span /></span>
          <span><strong>SetCraft</strong><small>Swim performance studio</small></span>
        </Link>
        <nav className="sc-landing-links" aria-label="Landing page navigation">
          <a href="#platform">Platform</a>
          <a href="#workflow">Workflow</a>
          <a href="#intelligence">Race intelligence</a>
          <a href="#standards">Why SetCraft</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="sc-landing-actions">
          {user ? (
            <a className="sc-landing-button sc-landing-button-primary" href="/studio">Open studio <ArrowRight /></a>
          ) : (
            <>
              <a className="sc-landing-login" href="/login">Log in</a>
              <a className="sc-landing-button sc-landing-button-primary" href="/signup">Sign up <ArrowRight /></a>
            </>
          )}
        </div>
      </header>

      <section className="sc-landing-hero" id="main-content">
        <div className="sc-landing-hero-copy">
          <div className="sc-landing-kicker"><span>Built for coaches on deck</span><span>LCM · SCM · SCY</span></div>
          <h1>From session brief<br />to <em>better swimming.</em></h1>
          <p className="sc-landing-hero-lede">
            SetCraft brings workout design, lane planning, deck delivery, season planning, and race intelligence into one serious coaching workspace.
          </p>
          <div className="sc-landing-hero-actions">
            <a className="sc-landing-button sc-landing-button-primary sc-landing-button-large" href={user ? "/studio" : "/signup"}>
              {user ? "Open your studio" : "Create your workspace"}<ArrowRight />
            </a>
            <a className="sc-landing-button sc-landing-button-ghost sc-landing-button-large" href="#platform">See the platform</a>
          </div>
          <div className="sc-landing-proof" aria-label="Platform highlights">
            <span><Check />Visual set building</span>
            <span><Check />Race evidence controls</span>
            <span><Check />Coach-reviewed AI</span>
          </div>
        </div>

        <figure className="sc-landing-hero-media">
          <img src={heroImage} alt="Competitive swimmers racing through marked pool lanes" />
          <div className="sc-landing-photo-shade" />
          <figcaption>Photo by Marcus Ng on Unsplash</figcaption>
          <div className="sc-landing-live-card" aria-label="Example session overview">
            <div className="sc-landing-live-card-head">
              <span><Waves />Quality aerobic</span><small>Tuesday · SCM</small>
            </div>
            <div className="sc-landing-live-metrics">
              <div><strong>3,800</strong><small>metres</small></div>
              <div><strong>75</strong><small>minutes</small></div>
              <div><strong>6</strong><small>lanes</small></div>
            </div>
            <div className="sc-landing-live-set">
              <span>MAIN SET</span>
              <strong>3 × (4 × 100 Free)</strong>
              <small>Threshold shape · descend 1–4</small>
            </div>
          </div>
        </figure>
      </section>

      <section className="sc-landing-format-bar" aria-label="SetCraft capability summary">
        <p>One connected studio</p>
        <div><strong>01</strong><span>Design the work</span></div>
        <div><strong>02</strong><span>Organize the lanes</span></div>
        <div><strong>03</strong><span>Deliver on deck</span></div>
        <div><strong>04</strong><span>Learn from the race</span></div>
      </section>

      <section className="sc-landing-section" id="platform">
        <div className="sc-landing-section-heading">
          <div>
            <p className="sc-landing-overline">The complete coaching workspace</p>
            <h2>Every detail has a place.<br /><span>Nothing feels buried.</span></h2>
          </div>
          <p>Purpose-built tools stay connected, but each workflow has room to breathe—from first draft to final review.</p>
        </div>
        <div className="sc-landing-feature-grid">
          {productAreas.map((area) => {
            const Icon = area.icon;
            return (
              <article className="sc-landing-feature-card" data-tone={area.tone} key={area.title}>
                <div className="sc-landing-feature-top"><span>{area.eyebrow}</span><Icon /></div>
                <h3>{area.title}</h3>
                <p>{area.copy}</p>
                <a href={user ? "/studio" : "/signup"}>Explore in SetCraft <ChevronRight /></a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sc-landing-product-stage" id="workflow">
        <div className="sc-landing-product-copy">
          <p className="sc-landing-overline">A clearer building rhythm</p>
          <h2>Think like a coach.<br />Build like a system.</h2>
          <p>Start with the purpose, compose the work, adapt it to real lanes, and validate the finished session before anyone touches the water.</p>
          <ol>
            <li><span>1</span><div><strong>Set the session brief</strong><small>Phase, duration, course, goal, and athlete context.</small></div></li>
            <li><span>2</span><div><strong>Compose the set</strong><small>Reusable blocks, nested repeats, notes, and constraints.</small></div></li>
            <li><span>3</span><div><strong>Fit the lanes</strong><small>Groups, send-offs, distance versions, and pace targets.</small></div></li>
            <li><span>4</span><div><strong>Review and deliver</strong><small>Validation, totals, deck sheet, PDF, and calendar.</small></div></li>
          </ol>
        </div>
        <div className="sc-landing-product-window" aria-label="SetCraft builder interface preview">
          <div className="sc-landing-window-bar"><span /><span /><span /><strong>Tuesday — Quality aerobic</strong><small>Auto-saved</small></div>
          <div className="sc-landing-window-layout">
            <aside>
              <p>BLOCKS</p>
              <div><Sparkles />Warm-up</div><div><Gauge />Threshold</div><div><Route />Race pace</div><div><Users />Lane split</div>
            </aside>
            <div className="sc-landing-window-canvas">
              <div className="sc-landing-window-section"><span>SECTION</span><strong>Activation & skills</strong><small>1,200 m</small></div>
              <div className="sc-landing-window-set" data-color="blue"><span>WARM-UP</span><strong>4 × 100 Choice</strong><small>@ 1:40 · RPE 3</small></div>
              <div className="sc-landing-window-set" data-color="green"><span>DRILL</span><strong>8 × 50 Free</strong><small>@ 1:00 · streamline focus</small></div>
              <div className="sc-landing-window-section"><span>SECTION</span><strong>Main set</strong><small>2,000 m</small></div>
              <div className="sc-landing-window-set" data-color="orange"><span>REPEAT × 3</span><strong>4 × 100 Free</strong><small>@ 1:25 · descend 1–4</small></div>
            </div>
            <aside className="sc-landing-window-inspector">
              <p>INSPECTOR</p><strong>4 × 100 Free</strong>
              <label>Stroke<span>Freestyle</span></label><label>Send-off<span>1:25</span></label><label>Effort<span>RPE 7</span></label>
            </aside>
          </div>
        </div>
      </section>

      <section className="sc-landing-intelligence" id="intelligence">
        <figure>
          <img src={poolImage} alt="Outdoor competition swimming pool with marked lanes" />
          <figcaption>Photo by Serena Repice Lentini on Unsplash</figcaption>
        </figure>
        <div>
          <p className="sc-landing-overline">Race intelligence with boundaries</p>
          <h2>Explain the race.<br />Keep the evidence intact.</h2>
          <p>SetCraft separates entered splits, modeled checkpoints, official references, athlete context, and AI narrative—so an explanation never quietly rewrites the facts.</p>
          <div className="sc-landing-intelligence-list">
            <span><ShieldCheck /><strong>Locked facts</strong><small>Records, standards, points, and supplied calculations stay immutable.</small></span>
            <span><Gauge /><strong>Course-aware</strong><small>LCM, SCM, and SCY are labeled and compared responsibly.</small></span>
            <span><Sparkles /><strong>Coach-controlled AI</strong><small>Drafts support the decision; they do not make it.</small></span>
          </div>
        </div>
      </section>

      <section className="sc-landing-standards" id="standards">
        <div>
          <p className="sc-landing-overline">Designed for real pool decks</p>
          <h2>Professional where it matters.<br />Quiet where it should be.</h2>
        </div>
        <div className="sc-landing-standard-grid">
          <article><strong>Readable under pressure</strong><p>Large type, high contrast, keyboard support, and clear states make the interface easier to use between repeats.</p></article>
          <article><strong>Built around the coach</strong><p>Real completion time, swimmer restrictions, and session purpose stay ahead of generic recommendations.</p></article>
          <article><strong>Structured for growth</strong><p>Projects, folders, custom blocks, season plans, and race records create a workspace that improves over time.</p></article>
        </div>
      </section>

      <section className="sc-landing-contact" id="contact">
        <div>
          <p className="sc-landing-overline">A real team behind the workspace</p>
          <h2>Questions before<br />the first session?</h2>
          <p>Talk to SetCraft about account access, club setup, product feedback, privacy, or partnership ideas. The contact details below are placeholders for launch preparation.</p>
        </div>
        <div className="sc-landing-contact-actions">
          <a href={`mailto:${SUPPORT_EMAIL}`}><Mail /><span><small>Email support</small><strong>{SUPPORT_EMAIL}</strong></span><ArrowRight /></a>
          <a href={`tel:${SUPPORT_PHONE_HREF}`}><Phone /><span><small>Call SetCraft</small><strong>{SUPPORT_PHONE}</strong></span><ArrowRight /></a>
          <Link href="/contact">Open the contact centre <ArrowRight /></Link>
        </div>
      </section>

      <section className="sc-landing-cta">
        <div><p className="sc-landing-overline">Your next session starts here</p><h2>Build the work.<br />Own the details.</h2></div>
        <div><p>Create a SetCraft account and open the complete studio—from the first training idea to the race review.</p><a className="sc-landing-button sc-landing-button-light sc-landing-button-large" href={user ? "/studio" : "/signup"}>{user ? "Open studio" : "Get started"}<ArrowRight /></a></div>
      </section>

      <footer className="sc-landing-footer">
        <Link className="sc-landing-logo" href="/"><span className="sc-landing-logo-mark" aria-hidden="true"><span /><span /><span /></span><span><strong>SetCraft</strong><small>Swim performance studio</small></span></Link>
        <p>Purpose-built workout design and race intelligence for competitive swimming.</p>
        <div><a href="#platform">Platform</a><a href="#contact">Contact</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/login">Log in</a><a href="/signup">Sign up</a></div>
        <small>© 2026 SetCraft. Coaches remain responsible for athlete suitability and final practice decisions.</small>
      </footer>
    </main>
  );
}
