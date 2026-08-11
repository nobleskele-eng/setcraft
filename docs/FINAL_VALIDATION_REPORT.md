# SetCraft v13 final validation report

Date: 11 August 2026  
Build: 4.0.0 / v13 Professional Race Intelligence

## Delivered

- Rebuilt Race Analysis as five focused tabs: Race Input, Athlete Profile, Split Breakdown, Comparisons and Report.
- Rebuilt Race Strategy as four focused tabs: Race Plan, Athlete Profile, Reference Races and Coach Brief.
- Added per-factor off/rating/measured controls for speed, aerobic speed, lactate response, explosiveness, strength, turns, start/underwater, technique and mobility.
- Added PDF and JSON export to both race workspaces.
- Added a separate non-record field library with 4,854 official races and 31,842 official checkpoints.
- Kept world records and SCY U.S. Open benchmarks in a distinct layer, with checkpoint-level measured/estimated provenance.
- Added local, authorization-gated coach reference creation and export.
- Replaced one comma field with event-aware split slots plus a quick-paste parser that preserves empty positions.

## Data validation

| Check | Result |
|---|---:|
| Eligible official source results | 13,558 |
| Selected field-library races | 4,854 |
| Official checkpoints | 31,842 |
| LCM / SCM / SCY | 2,345 / 2,001 / 508 |
| Sectionals / Nationals / Trials / World Class | 1,071 / 1,466 / 1,079 / 1,238 |
| Anonymized minor swims | 900 |
| Sources | 4 official Omega Lenex files + 2 official NCAA final-result PDFs |

Every selected result has a final total, monotonic original checkpoints, source URL and a matching checkpoint-provenance array. World-record references are excluded from these counts.

## Verification

- `npm test`: pass — production build, 11 race-intelligence tests and rendered preview metadata.
- `npm run lint`: pass with no warnings.
- `npm run validate:artifact`: pass — ESM Worker entry and hosting manifest present.
- PDF inspection: pass — one-page A4 sample rendered through Poppler; no clipping, overflow or missing sections.
- Split parser coverage: pass for blank input, double commas, partial anchors, invalid monotonic values, long events and SCY-specific checkpoints.
- Profile coverage: pass for disabled factors, 1–10 ratings, inverse measured protocols and neutral measured lactate.

The bundler reports a large client chunk because the user-requested offline race library is shipped in the application. This affects initial download size but keeps all 4,854 comparison races available without a remote database.
