# SetCraft Swim Studio v20

SetCraft is a coach-first swim planning and race-intelligence workspace. It combines a visual set builder, lane planning, pool-deck exports, season planning, race analysis, strategy tools, curated workouts, and a server-protected AI coaching layer in one authenticated application.

## What changed in v20

- The primary application sidebar can be collapsed or restored from every workspace page. The preference is remembered on the device.
- Build Sets now has clearly labeled controls for the block library and workout inspector, plus a one-click **Focus canvas** mode.
- The block library and inspector can also be closed directly from their own panel headers.
- Builder panel preferences persist while moving between Project Setup, Build Sets, Lane Plan, Deck Sheet, and Review & Export.
- The builder grid was resized so the right inspector remains inside the viewport instead of extending past the page edge.
- At narrower widths, optional builder panels become contained overlays; the workout canvas remains usable without page-level horizontal scrolling.
- v19 calendar improvements remain included: accessible Week, Month, and Year views with period summaries and drill-down navigation.

## Main workspaces

- **Project Hub** — create, save, organize, reopen, and group workout projects by season folder.
- **Project Setup** — define the practice name, training phase, pool course, duration, focus, tags, and folder.
- **Build Sets** — compose nested sections, repeats, conditions, progressions, time caps, lane branches, notes, and swim blocks.
- **Lane Plan** — assign swimmers, lanes, send-offs, pace versions, and lane-specific set variants.
- **Deck Sheet** — prepare practice headers, coach notes, targets, goal-time tables, and print-ready deck information.
- **Review & Export** — validate the workout, inspect calculated totals, preview the deck sheet, and export PDF or structured JSON.
- **Season Calendar** — plan detailed weeks and review monthly or yearly training load.
- **Race Analysis Lab** — compare LCM, SCM, and SCY performances with official reference data and transparent modeled checkpoints.
- **Race Strategy Studio** — build athlete-aware race plans without allowing profile inputs or AI text to overwrite locked records or calculations.
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

## Reference data and evidence boundaries

The checked-in race library uses official Omega/Lenex and NCAA result sources documented in `docs/RACE_LIBRARY_DATA_MANIFEST.json`. World records, U.S. Open SCY benchmarks, entered splits, modeled checkpoints, athlete context, and AI narrative remain separate evidence layers.

Regenerate the field library by supplying the six official source files:

```bash
node scripts/build-race-library.mjs <usa-nationals.lef> <usa-junior-nationals.lef> <worlds.lef> <world-scm.lef> <ncaa-men.txt> <ncaa-women.txt>
```

## Data storage and privacy

- Workout drafts, panel preferences, saved projects, custom blocks, and calendar plans are stored locally in the browser unless a future hosted data layer is explicitly configured.
- Authentication protects the workspace and AI endpoints.
- Coaches remain responsible for checking athlete suitability, medical restrictions, intervals, recovery, and final practice decisions.

## Release

This source package corresponds to **SetCraft Swim Studio v20**.
