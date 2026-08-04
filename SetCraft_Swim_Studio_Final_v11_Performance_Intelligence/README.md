# SetCraft Swim Studio v11 — Performance Intelligence

SetCraft is a coach-oriented swim workout and race-analysis workspace. This release preserves the complete studio and upgrades Race Intelligence with current world records, official points, goal/age scoring, partial-split completion, optional athlete-profile context and exportable AI analysis.

## What is new in v11

- All 34 individual LCM world records (17 events × men/women), checked against World Aquatics on 4 August 2026.
- Complete comparison checkpoint lines at 15/25/35/50 m for 50s, every 25 m for 100s and every 50 m for longer races.
- Every checkpoint is labeled **Official**, **Secondary** or **Estimated**; an estimated checkpoint is never presented as an official split.
- Official 2026 World Aquatics points using the frozen annual base table and `P = 1000 × (B/T)³`, truncated to an integer.
- A separate live-world-record gap, because records set during 2026 do not retroactively change the official 2026 points table.
- SetCraft score (0–100): 60% official-points performance, 25% exact-age performance and 15% progress toward the selected goal. When no exact-age table exists, the weights become 80% and 20%.
- Input-quality score based on timing provenance, valid total, split completeness, consistency and analysis context.
- Empty splits—including `,,` placeholders—are filled with the selected strategy shape or a balanced event-normal model and remain visibly marked **Estimated**.
- Optional height, body mass, strength, explosiveness, lactate production/tolerance, aerobic capacity, shoulder/ankle mobility and underwater-skill inputs. These add interpretation context but never alter official World Aquatics points.
- Gemini race-analysis endpoint with deterministic calculations supplied as locked facts, plus a complete offline analysis when no API key is configured.
- Standalone HTML analysis-page export and structured JSON export.
- Coach form and CSV import accept incomplete split lines, estimate the missing checkpoints and preserve coach/estimated provenance.

The existing all-events library remains available: 408 event/sex/level/strategy models, 99 observed 2025 Worlds medal performances, exact-age USA Swimming standards and detailed U.S. reference races.

## Run on Windows PowerShell

Requirements: Node.js 22.13 or newer.

```powershell
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`.

To enable live Gemini analysis, set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in the server environment. Without credentials, the app produces a deterministic offline report. Never place secrets in client-side code.

## Verify

```powershell
npm run test:race
npm run build
npm run validate:artifact
```

Methodology, formulas, provenance and limits are documented in `docs/RACE_MODEL_METHODOLOGY.md`; the full validation record is in `docs/FINAL_VALIDATION_REPORT.md`.
