# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**[Inferred — interview prompt went unanswered; confirm before treating as final.]** Primary user: swim coaches building and running practice sets, working solo or within a club/team program. The app models three roles (`Coach`, `Athlete`, `ClubAdmin`), but the workflow depth (Studio, Deck Sheet export, Race Intelligence, Calculators) is built around the coach's authoring and analysis job; Athlete and ClubAdmin are supporting roles in the same workspace rather than separately-optimized experiences.

## Product Purpose

SetCraft Swim Studio is a coach-oriented swim workout and race-analysis workspace. It lets a coach author structured practice sets (a block-based language with containers, presets, and a Quick Write text parser), turn them into deck-ready output (lane plans, deck sheets, PDF export), and analyze race performance against official World Aquatics data (points, world records, age standards) with optional AI-assisted interpretation. Success means a coach spends less time on manual math/formatting and more time on the actual training decision.

## Positioning

**[Inferred — interview prompt went unanswered; confirm before treating as final.]** Two mechanisms combine to differentiate this from a generic workout planner, spreadsheet, or paper deck sheet:

1. **Deterministic engine as source of truth.** `swimStudioEngine.ts` / `swimMath.ts` compute totals, feasibility (send-off vs. target time, booking overruns, warm-up/cooldown checks), and race math directly — the AI layer (Gemini-backed copilot, race analysis) is explicitly *not* the source of mathematical truth and degrades to a labeled offline/local fallback when no API key is configured.
2. **Provenance-labeled race intelligence.** Race Intelligence uses official 2026 World Aquatics points tables, current LCM world records (checked against World Aquatics as of 4 August 2026), and exact-age standards; every checkpoint/split is explicitly labeled Official, Secondary, or Estimated — an estimated value is never presented as an official one.

## Operating Context

- Studio workflow is deliberately split into five pages to reduce visual overload while keeping every feature: Project Setup → Build Sets → Lane Plan → Deck Sheet → Review & Export.
- Coaches also work from a Project Hub (projects/folders/season plans), a curated + coach-built Famous Sets library (30 curated workouts, reusable "My Blocks"/Favorites/Backpack), a Season Calendar, Swim Calculators (pace, splits, send-off/lane, critical speed, stroke efficiency, set math, course conversion), and Settings.
- Deck Sheet output is meant to leave the app: PDF export and a standalone HTML race-analysis export exist as artifacts coaches hand off or print deck-side.
- Race data entry accepts imperfect input on purpose: coach form and CSV import accept incomplete split lines (including `,,` placeholders) and estimate the missing checkpoints rather than rejecting the input.

## Capabilities and Constraints

- **Local-first storage, no backend accounts.** Projects, folders, drafts, custom blocks, favorites, backpack items, calendar plans, and preferences all live in `localStorage`; Settings provides manual backup export/import and explains the limitation. **[Inferred as a durable constraint — interview prompt went unanswered.]** The implementation notes frame this as deliberate ("avoids pretending that a backend account system exists"), not a placeholder, but this has not been confirmed directly by the user this session.
- Swim-first scope: multi-sport support is an explicit roadmap item, not current scope.
- AI integration (Gemini) is optional and additive: server defaults to a Gemini model when a live key is supplied; missing keys, malformed requests, and model failures degrade to labeled local/offline fallbacks rather than failing the feature.
- Request bodies to the AI endpoint are capped and inputs normalized; secrets are server-side only (`GEMINI_API_KEY`), never client-side.
- Deployment target includes a Cloudflare Worker (`worker/`, `wrangler.toml`-style tooling) alongside the Vite/React app.

## Brand Commitments

- Name: **SetCraft Swim Studio** (interface badge has carried version labels like "v8 Final"; current release framed as "v11 — Performance Intelligence").
- Palette direction confirmed in a prior session (see project feedback memory): a cohesive water/ocean **blue** theme across app chrome — primary accent blue-600, sky-400/500 highlights, slate-950/indigo-950 backgrounds — with neon accents (cyan, emerald, violet, multi-color gradients) retired from chrome. The block-palette category dots and node-card colors inside the Studio's working area (composer/palette/canvas/inspector) are exempt from this and keep their existing color coding.
- UI philosophy confirmed in the same feedback: spacious, low-clutter layout is a deliberate brand trait, not just a style preference — "our product is meant to save time not add to struggle."

## Evidence on Hand

- 34 individual LCM world records (17 events × men/women), checked against World Aquatics on 4 August 2026.
- 99 observed 2025 Worlds medal performances used as reference races.
- Exact-age USA Swimming standards for age-factor scoring.
- 30 library workouts in `famousWorkouts.ts` — a mix of transformed, attributed public-source-inspired templates and original SetCraft templates.
- 131 palette (block) presets in the Studio's block language.
- No customer testimonials, case studies, press mentions, or client logos exist in the repository — do not fabricate any for future work.

## Product Principles

1. Deterministic math is the source of truth; AI assists interpretation but never overrides or silently replaces a validated calculation.
2. Every derived or estimated value carries visible provenance (Official/Secondary/Estimated) rather than being presented as fact.
3. Reduce cognitive load over maximizing customizability — spacious, clearly grouped controls beat dense power-user chrome.
4. Coach-owned, local-first data: no forced account system, and any storage limitation is explained to the user rather than hidden.
5. Depth in swimming over breadth across sports, for now — multi-sport is an acknowledged future direction, not current scope.

## Accessibility & Inclusion

The app already ships two user-facing accessibility toggles (in Settings, reflected as `data-setcraft-reduce-motion` and `data-setcraft-large-deck` on the document root): reduced motion and larger deck-sheet text. No further product-specific accessibility requirement has been established beyond these.
