# SetCraft Swim Studio v22

SetCraft is a coach-first swim planning and race-intelligence workspace. v22 adds a complete trust centre, stronger account recovery, and image-enabled Coach Block AI while retaining the public product website and protected studio introduced in v21.

## What changed in v22

- Added dedicated **Terms of Service**, **Privacy Policy**, and **Contact** pages plus visible landing-page and footer links.
- Added a professional landing-page contact section with replaceable placeholder email, phone, location, and response expectations.
- Sign-up now requires a matching repeated password and explicit acceptance of the Terms and Privacy Policy.
- Added `/forgot-password` and `/reset-password` with generic account-enumeration-safe responses, hashed single-use D1 reset tokens, a 20-minute expiry, session revocation after reset, and an optional Resend email-delivery hook.
- Coach Block AI now accepts one JPEG, PNG, or WebP image up to 6 MB, shows a preview, and sends the image only with the current protected Gemini request. The assistant is instructed to describe visible evidence and never identify, diagnose, or assess athlete readiness from an image.
- Added clear privacy language for essential cookies, account data, device-local workouts, AI prompts, temporary image processing, retention, access, correction, and deletion requests.

## Included from v21

- A responsive public landing page now loads at `/`, so visitors no longer meet an authentication wall or dead entry route before seeing SetCraft.
- The landing page uses an editorial, sport-led visual system with real swimming photography, clear product storytelling, strong navigation, and direct links into the working studio.
- **Log in** and **Sign up** sit at the top right on desktop and remain easy to reach on smaller screens.
- First-party account creation supports full name, email, password, phone, swim club, club role, city/region, and primary course.
- Credentials and sessions are stored in D1. Passwords use PBKDF2-SHA-256 with a unique salt and 210,000 iterations; session tokens are hashed before storage and sent in HttpOnly, SameSite cookies.
- `/studio` and the Gemini coaching routes require a valid SetCraft session. Anonymous studio visits redirect to `/login`.
- A branded not-found page replaces the unhelpful black `Not Found` response for unknown application routes.
- v20's collapsible application sidebar, closable builder library and inspector, focus-canvas mode, corrected inspector sizing, and persisted panel preferences remain included.
- The Season Calendar still provides accessible Week, Month, and Year views with period summaries and drill-down navigation.

## Main routes

- `/` — public SetCraft landing page
- `/login` — email and password login
- `/signup` — account and swim-club profile creation
- `/forgot-password` — account recovery request
- `/reset-password` — single-use password reset
- `/terms` — Terms of Service
- `/privacy` — Privacy Policy
- `/contact` — support and privacy contact centre
- `/studio` — authenticated coaching workspace

## Main workspaces

- **Project Hub** — create, save, organize, reopen, and group workout projects by season folder.
- **Project Setup** — define the practice name, phase, pool course, duration, focus, tags, and folder.
- **Build Sets** — compose nested sections, repeats, conditions, progressions, time caps, lane branches, notes, and swim blocks.
- **Lane Plan** — assign swimmers, lanes, send-offs, pace versions, and lane-specific set variants.
- **Deck Sheet** — prepare practice headers, coach notes, targets, goal-time tables, and print-ready information.
- **Review & Export** — validate totals, preview the deck sheet, and export PDF or structured JSON.
- **Season Calendar** — plan by week and review monthly or yearly training load.
- **Race Analysis Lab** — compare LCM, SCM, and SCY performances with clear evidence boundaries.
- **Race Strategy Studio** — build athlete-aware plans without overwriting locked records or calculations.
- **Coach Block AI** — generate and revise coach-reviewed drafts through protected server routes.

## Local requirements

- Node.js 22.13 or newer
- npm

## Install and run

```bash
npm run install:ci
npm run dev
```

Open the local address shown by the development server.

## Account database

The hosted configuration binds a D1 database as `DB`. Checked-in Drizzle migrations create `users`, `sessions`, and `password_reset_tokens`.

Optional password-reset email delivery uses `RESEND_API_KEY` and `PASSWORD_RESET_FROM_EMAIL`. When these are not configured, the recovery page safely directs users to the placeholder support contact without exposing whether an account exists.

When changing the schema, generate a new migration with:

```bash
npm run db:generate
```

## Optional Gemini configuration

The application remains usable without AI credentials. For live AI responses, copy `.env.example` to `.env.local`, add the required Gemini key, and restart the development server. Gemini calls are made through authenticated server routes; keys must never be placed in client-side code or committed to source control.

To prepare the reviewed coaching-knowledge layer and run the AI evaluation set:

```bash
npm run ai:setup-rag -- --write-env
npm run ai:eval
```

See `docs/AI_MODEL_IMPLEMENTATION_GUIDE.md` for the complete configuration, evaluation, and privacy workflow.

## Verification

Run the complete production and policy test suite:

```bash
npm test
```

Individual checks are also available:

```bash
npm run lint
npm run build
npm run test:race
npm run test:ai-policy
npm run validate:artifact
```

## Data storage and privacy

- Account profiles, hashed sessions, and hashed short-lived password-reset tokens are stored in the hosted D1 database.
- Workout drafts, panel preferences, saved projects, custom blocks, and calendar plans remain in the browser unless a future hosted project-data layer is configured.
- Gemini text and image requests pass through session-protected server routes. AI image attachments are not saved to SetCraft D1 or R2 in v22.
- Coaches remain responsible for athlete suitability, medical restrictions, intervals, recovery, and final practice decisions.

## Release

This source package corresponds to **SetCraft Swim Studio v22**.
