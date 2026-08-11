# SetCraft Swim Studio v13 — Professional Race Intelligence

SetCraft is a coach-oriented workout, race-analysis and race-strategy workspace for LCM, SCM and SCY. v13 redesigns both race tools around structured tabs, independently controlled athlete factors, a large official comparison library, exact split provenance and professional PDF reports.

## v13 highlights

- Race Analysis Studio with dedicated Race Input, Athlete Profile, Split Breakdown, Comparisons and Report tabs.
- Race Strategy Studio with dedicated Race Plan, Athlete Profile, Reference Races and Coach Brief tabs.
- Every performance factor can be switched off, self-rated from 1–10, or entered as a protocol-specific professional value. Measured lactate is retained as neutral event context and is never interpreted as “higher is better.”
- 4,854 selected non-record races from 13,558 eligible official results, with 31,842 official checkpoints across LCM, SCM and SCY.
- Four comparison bands: 1,071 Sectionals, 1,466 Nationals, 1,079 Trials and 1,238 World Class references. The bands are performance-navigation labels; source result, course, meet and AQUA points remain visible.
- World records remain a separate benchmark layer. SCY leaders are labeled U.S. Open benchmarks rather than world records.
- Minor athlete names are anonymized in the local reference library. Coach-owned references remain local to the browser and require an authorization confirmation.
- Event-aware individual split fields plus quick paste. Empty comma positions remain empty, and only unknown or invalid checkpoints are modeled.
- Exportable analysis and strategy PDFs plus audit-ready JSON.
- Deterministic calculations and official source provenance remain locked facts for Gemini explanations; the app includes a safe offline brief when no API key is configured.

## Reference data

The generated field library uses official Omega Lenex results for the 2025 World Championships, 2024 World 25 m Championships, 2026 Toyota National Championships and 2026 Speedo Junior National Championships, plus official 2026 NCAA Division I final-results PDFs. See `docs/RACE_LIBRARY_DATA_MANIFEST.json` for counts and source URLs.

Regenerate the checked-in library by passing the six official source files to the build script:

```bash
node scripts/build-race-library.mjs <usa-nationals.lef> <usa-junior-nationals.lef> <worlds.lef> <world-scm.lef> <ncaa-men.txt> <ncaa-women.txt>
```

## Run

Requires Node.js 22.13 or newer.

```bash
npm run install:ci
npm run dev
```

Open the local address printed by the development server. For live Gemini responses, copy `.env.example` to `.env.local`, set `GEMINI_API_KEY`, and restart. The application remains functional without credentials.

## Verify

```bash
npm run test:race
npm run lint
npm run build
npm run validate:artifact
```

Official totals, measured checkpoints, modeled checkpoints, athlete context and AI narrative are separate evidence layers. Neither AI nor profile inputs may change records, standards, points or provenance.
