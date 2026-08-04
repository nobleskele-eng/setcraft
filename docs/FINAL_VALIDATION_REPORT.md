# SetCraft final validation report

Date: 2026-08-04  
Build: 2.0.0 / v10 All Events Race Intelligence

## Coverage delivered

- 17 standard individual LCM events, for Men and Women.
- Four reference levels: Sectionals, Nationals, Trials and World Class.
- Three event-specific race strategies per event and level.
- 408 generated reference profiles for the selected age: 17 events × 2 categories × 4 levels × 3 strategies.
- 99 observed medal-race profiles from all 34 individual finals at the 2025 World Aquatics Championships.
- 34 existing U.S./historical men's 200 freestyle profiles retained for detailed domestic comparisons.
- USA Swimming single-age motivational standards for ages 10–18 where the federation publishes that event.

## Checkpoint rules verified

- 50 m: 15, 25, 35 and 50 m.
- 100 m: every 25 m.
- 200 m and longer: every 50 m.
- Every generated cumulative checkpoint is monotonic and the last checkpoint equals the target time.
- A 1500 m analysis contains 30 checkpoint rows and ends at 1500 m.

## Data and model checks

- All 34 event/category cells in the 2025 Worlds source are represented.
- Generated models: 408.
- Observed 2025 Worlds profiles: 99.
- Invalid or non-monotonic profiles: 0.
- Finish-time mismatches: 0.
- Age-standard spot check: age-15 boys' 100 free at 54.49 returns AAAA.
- Non-Olympic 50 m stroke events label the Trials target as modeled rather than official.
- Modeled intermediate checkpoints remain visibly distinct from observed timing data.

The repeatable source-data build is:

```bash
npm run data:extract -- /path/to/official-worlds-2025.lef /path/to/usa-single-age.txt
```

## Coach contribution checks

- Single-race entry works.
- Bulk CSV import works with cumulative split checkpoints.
- Validation rejects checkpoint/split count mismatches, non-increasing cumulative times and finish discrepancies above 0.10 seconds.
- Coach entries appear in the reference library, are marked pending/manual, can be exported and can be deleted.

## Application validation

Passed on 2026-08-04:

```bash
npx eslint src/components/RaceLab.tsx src/raceModel.ts scripts/extract-reference-data.mjs
npm run build
npm run validate:artifact
npm test
```

The repository-wide lint command still reports legacy React-rule violations in older screens outside Race Intelligence. They do not block the production build, and this release does not claim they were corrected.

Browser QA confirmed:

- Race Intelligence renders without application errors.
- Event, category, age, level and strategy controls recalculate the analysis.
- 50 free displays 15/25/35/50 m checkpoints.
- The library can filter to a specific event/category and returns the appropriate observed races.
- Coach add and delete flows work.
- The 1500 m analysis remains usable with all 30 rows.

## Accuracy boundaries

- Publicly visible pages are not treated as permission for bulk scraping. The app accepts authorized coach exports and manually verified data.
- Observed splits, official standards and modeled targets use separate labels.
- 15/25/35 m targets are modeled unless an official measurement source explicitly supplies those marks.
- A generated strategy is a planning reference, not a claim that every swimmer should copy the same pacing pattern.
