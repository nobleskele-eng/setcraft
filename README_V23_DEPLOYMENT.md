# LaneLab v23 — Cloudflare deployment guide

This package is configured for the Cloudflare account that manages `lanelab.studio`. It does not contain any API key, password, Cloudflare token, or production database ID.

## 1. Finish the domain handoff

At Porkbun, use the two authoritative nameservers Cloudflare assigned to the zone. Do not add those nameservers as NS records in the Porkbun DNS-record form.

Wait until **Cloudflare → lanelab.studio → Overview** reports **Active**.

## 2. Remove the parking records

In **Cloudflare → DNS → Records**, remove the imported Porkbun parking entries before deployment:

- Apex A records pointing to `207.207.210.107` and `207.207.210.229`.
- `www` CNAME pointing to `pixie.porkbun.com`.
- Wildcard `*` CNAME pointing to `pixie.porkbun.com`.

Do not manually create the Worker DNS records. Wrangler creates the exact custom-domain records and certificates from `wrangler.jsonc`.

Keep any MX, SPF, DKIM, DMARC, or other email records if you are already using domain email.

## 3. Run the deployment wizard

Install the current Node.js LTS release. It must be Node 22.13 or newer. Extract the release ZIP, then open PowerShell in the project folder:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup-cloudflare.ps1
```

The wizard performs these operations in order:

1. Runs `npm ci` from the pinned lockfile.
2. Validates the release structure.
3. Opens Cloudflare authentication if needed.
4. Creates `lanelab-production` in D1 if it does not exist.
5. Replaces the safe all-zero D1 placeholder in `wrangler.jsonc` with the real database UUID.
6. Applies the checked-in `users`, `sessions`, and `password_reset_tokens` migrations.
7. Offers secure prompts for Gemini and Resend Worker secrets.
8. Builds with Vinext and deploys the Worker to the apex and `www` custom domains.

You can prepare everything without deploying yet:

```powershell
.\scripts\setup-cloudflare.ps1 -SkipDeploy
npm run deploy:cloudflare
```

## 4. API keys and email

### Gemini

Create a server-side Gemini API key in Google AI Studio, then either enter it in the wizard or run:

```powershell
npx wrangler secret put GEMINI_API_KEY
```

LaneLab never sends this key to the browser. If you skip it, the product remains usable and the coaching assistant returns its offline fallback.

If you later build the reviewed File Search knowledge store:

```powershell
npm run ai:setup-rag -- --write-env
npx wrangler secret put GEMINI_FILE_SEARCH_STORE
```

Enter the resulting `fileSearchStores/...` value at the prompt.

### Password-reset email

Create a Resend account and verify `lanelab.studio` in Resend before using the configured sender `LaneLab <noreply@lanelab.studio>`. Then run:

```powershell
npx wrangler secret put RESEND_API_KEY
npm run deploy:cloudflare
```

If Resend is not configured, forgot-password responses remain generic so account existence is not exposed, but no email is delivered.

### Change or remove secrets

```powershell
npx wrangler secret list
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret delete GEMINI_API_KEY
```

Never paste a real key into `.env.example`, `.dev.vars.example`, `wrangler.jsonc`, GitHub, or a screenshot.

## 5. Verify production

Open these URLs after deployment:

- `https://lanelab.studio/`
- `https://lanelab.studio/signup`
- `https://lanelab.studio/login`
- `https://lanelab.studio/forgot-password`
- `https://lanelab.studio/terms`
- `https://lanelab.studio/privacy`
- `https://lanelab.studio/contact`
- `https://lanelab.studio/api/health`

Create a test account, log out and back in, open the studio, switch the calendar between Week/Month/Year, collapse both workspace sidebars, and test a small Coach Block AI request.

## Common fixes

### Custom domain already has a DNS record

Delete the old parking A/CNAME record for that exact hostname, wait a minute, and run:

```powershell
npm run deploy:cloudflare
```

### D1 binding error

Run the setup wizard again. It is safe to re-run: it finds the existing `lanelab-production` database, rewrites the same UUID, and applies only pending migrations.

### Login says storage is unavailable

Confirm `wrangler.jsonc` has a non-placeholder `database_id`, then run:

```powershell
npm run db:migrate:remote
npm run deploy:cloudflare
```

### Forgot-password sends no message

Confirm Resend domain verification, sender-domain alignment, and the presence of `RESEND_API_KEY` in `npx wrangler secret list`.

### Deploy with a different Cloudflare account

```powershell
npx wrangler logout
npx wrangler login
.\scripts\setup-cloudflare.ps1
```

## Updating later

After pulling a future source update:

```powershell
npm ci
npm run db:migrate:remote
npm run deploy:cloudflare
```

Back up important production data before destructive schema changes. Current migrations are additive and preserve existing accounts.
