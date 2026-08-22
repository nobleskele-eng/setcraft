# LaneLab Swim Studio v23

LaneLab is a production-ready swim coaching workspace for workout design, lane planning, deck delivery, season calendars, race intelligence, and coach-reviewed AI. This release is prepared for Cloudflare Workers at **https://lanelab.studio**.

## Deploy after your Cloudflare nameserver step

On your Windows computer:

1. Extract this ZIP.
2. Confirm Cloudflare shows `lanelab.studio` as **Active**.
3. In Cloudflare DNS, delete the old Porkbun parking records: the two `207.207.210.*` apex A records and the `pixie.porkbun.com` CNAME records for `www` and `*`.
4. Open PowerShell in the extracted project folder.
5. Run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup-cloudflare.ps1
```

The wizard installs exact packages, signs in to Cloudflare, creates or finds the D1 database, inserts its real ID into `wrangler.jsonc`, applies the login migrations, securely prompts for optional Gemini and Resend keys, builds the production Worker, and deploys both `lanelab.studio` and `www.lanelab.studio`.

Read [README_V23_DEPLOYMENT.md](./README_V23_DEPLOYMENT.md) for exact dashboard steps, troubleshooting, local development, and secret-management commands.

## What is included

- Public, responsive LaneLab landing page with editorial swimming photography, platform storytelling, top-right login/sign-up actions, contact section, accessible navigation, and production social metadata.
- Email/password login and D1-backed account creation with full name, optional phone, swim club, role, city, and course.
- Repeated password validation on sign-up and password reset.
- PBKDF2-SHA-256 password hashing with per-user salts and 210,000 iterations.
- Hashed 30-day session tokens in HttpOnly, Secure, SameSite cookies.
- Forgot-password and single-use reset-token flow with 20-minute expiry and session revocation.
- Terms of Service, Privacy Policy, Contact, custom 404, and security headers.
- Authenticated studio and Gemini routes.
- Coach Block AI text and image input for JPEG, PNG, and WebP files up to 6 MB. Images are sent only with the protected request and are not stored in D1 or R2 by this release.
- Collapsible application sidebar, closable builder library and inspector, focus-canvas mode, and corrected panel sizing.
- Week, Month, and Year calendar views.
- Cloudflare Worker, static asset, Images, D1, custom-domain, and Smart Placement configuration.
- Windows setup/deploy wizard, checked-in D1 migrations, local secret templates, and release validator.

## Routes

- `/` — public landing page
- `/login` and `/signup` — account access
- `/forgot-password` and `/reset-password` — account recovery
- `/terms`, `/privacy`, and `/contact` — trust and support pages
- `/studio` — authenticated coaching workspace
- `/api/health` — deployment and AI configuration health

## Runtime services

| Service | Binding or secret | Purpose | Required |
|---|---|---|---|
| Cloudflare D1 | `DB` | Users, hashed sessions, reset tokens | Yes |
| Worker Assets | `ASSETS` | Built site assets | Yes |
| Cloudflare Images | `IMAGES` | Vinext image optimization | Configured |
| Gemini | `GEMINI_API_KEY` | Live coach AI and image review | Optional |
| Gemini File Search | `GEMINI_FILE_SEARCH_STORE` | Reviewed coaching knowledge retrieval | Optional |
| Resend | `RESEND_API_KEY` | Password-reset email delivery | Optional |

API keys are never placed in client code or committed configuration. The setup wizard stores them as encrypted Cloudflare Worker secrets.

## Local development

Requirements: Node.js 22.13 or newer and npm.

```powershell
npm ci
Copy-Item .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Add local-only keys to `.dev.vars`. The file is ignored by Git. Without Gemini, LaneLab uses its offline coaching fallback. Without Resend, the recovery endpoint stays account-enumeration safe but does not send email.

## Verification

```bash
npm run release:validate
npm run lint
npm test
```

This source package corresponds to **LaneLab Swim Studio v23** (`5.0.0`).
