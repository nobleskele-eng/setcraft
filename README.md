# SetCraft Swim Studio v10 — All-Events Race Intelligence

SetCraft is a coach-oriented swim workout and race-analysis workspace. This build preserves the complete studio—projects and folders, visual set builder, lane plans, deck sheets, famous sets, calculators, calendar, AI Coach, community and settings—and turns Race Intelligence into a searchable, coach-extensible all-events system.

## Race Intelligence v2

- 17 standard individual LCM events for men and women.
- Four absolute reference points: 2026 Speedo Sectionals, 2026 Toyota Nationals, 2024 U.S. Olympic Trials and the 2025 World Championships final mean.
- Three event-specific strategies at every event/category/level combination: 408 modeled reference profiles at a selected age.
- 99 observed 2025 Worlds medal-race profiles across all 34 event/category finals, extracted from the official Omega Lenex result file.
- The existing 34-race U.S./historical men's 200 free library remains available for Sectionals, Nationals, Trials and elite comparison.
- Exact-age B/BB/A/AA/AAA/AAAA scoring for ages 10–18 across every LCM event USA Swimming publishes for that age.
- Checkpoints at 15/25/35/50 m for 50s, every 25 m for 100s and every 50 m from 200 through 1500.
- Clear separation between observed official splits, derived strategy checkpoints and coach-added pending records.
- Search and filters for event, category, level, data type and athlete/strategy/meet text.
- Coach form, CSV bulk import, record removal, filtered-library JSON export and analysis JSON export.
- Source link, verification state, race context, best-fit athlete type and pacing risk on every reference.

For non-Olympic 50 back/breast/fly, the Trials profile is explicitly labeled a modeled equivalent. It is not presented as an official U.S. Trials cut. Official 50 m result files do not contain 15/25/35 m values, so those intermediate sprint checkpoints are also labeled modeled unless a coach supplies measured data.

## Run on Windows PowerShell

Requirements: Node.js 22.13 or newer.

```powershell
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`.
The scripts use plain `vite`, so they work in PowerShell without Unix-style environment-variable syntax.

The AI Coach uses its offline fallback without credentials. To enable live Gemini responses, set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in the server environment. Never place secrets in client-side code.

## Validation

```powershell
npm run build
npm run validate:artifact
```

Methodology, formulas, provenance and limits are in `docs/RACE_MODEL_METHODOLOGY.md`. The official-data extractor is `scripts/extract-reference-data.mjs`.
