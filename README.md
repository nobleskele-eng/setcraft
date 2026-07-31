# SetCraft Swim Studio

SetCraft is a swim-first, Scratch-inspired programming environment for building complete practices as editable blocks. Coaches can organize season projects, assemble nested sets, calculate pace and timing, create lane-specific versions, review deterministic warnings, and export a one-page pool-deck sheet.

> Final research build 1.1.0 · React 19 · Vite 6 · Express · TypeScript · Tailwind CSS 4

## What is included

### Visual Swim Studio

- Scratch-style drag, insert, reorder, and C-shaped nesting behavior.
- Sections, repeats, progressions, conditions, time caps, lane branches, coach notes, and reusable custom blocks.
- Searchable category toolbox with **131 ready-made presets** covering warm-up, technique, starts, turns, underwaters, kick, pull, aerobic, threshold, sprint, race pace, lactate, USRPT-style work, test sets, recovery, and control structures.
- Quick Write parser that converts familiar set notation into editable blocks.
- Favorites, Backpack, My Blocks, duplicate, lock, collapse/expand, zoom, fit-to-workspace, undo, and redo.
- Live distance, duration, intensity, stroke, equipment, recovery, and high-intensity summaries.

### Five-stage planning workflow

1. **Project Setup** — name, focus, season phase, tags, pool, booking, and folder.
2. **Build Sets** — visual block programming and Quick Write.
3. **Lane Plan** — add/remove lanes, rosters, pace/send-off defaults, swimmer notes, and set-specific overrides.
4. **Deck Sheet** — session metadata, coaching points, target-goal tables, and bottom notes.
5. **Review & Export** — deterministic checks, optional AI second review, JSON export, and one-page PDF.

### Project and season organization

- Create, save, reopen, duplicate, move, search, and delete workout projects.
- Create empty folders before workouts exist.
- Organize work into Endurance, Power, Threshold, Speed, Race Pace, Taper, Competition Week, Recovery, Testing, or custom folders.
- Auto-save drafts locally while editing.
- Assign saved projects to a real week planner and inspect programmed weekly distance, duration, and high-intensity session count.

### Calculators

SetCraft includes seven deterministic calculator workspaces:

1. Pace table for common distances.
2. Even, negative, positive, and fast-finish race split plans.
3. Send-off and multi-lane cycle planner.
4. Two-trial critical swim speed calculation.
5. Stroke rate, distance per cycle, velocity, and stroke index.
6. Set distance, duration, swim/rest time, and work-to-rest ratio.
7. Exact metre/yard distance conversion and same-velocity time estimate.

The calculator UI explains the formula and assumptions. Course-converted time is intentionally labeled as a neutral same-velocity estimate, not an official performance conversion.

### Workout library

- **30 complete editable workouts**.
- Public-source-inspired templates include attribution and a transformation disclaimer.
- Twelve additional workouts are original SetCraft templates spanning endurance, threshold, speed, power, IM, starts/turns, recovery, meet warm-up, and taper use cases.
- Coaches can add their own completed projects to the Coach Library, reopen them in Studio, edit them, and export a new version.

### AI Coach, with deterministic controls

- Generate a draft set, edit a draft, ask a coaching question, or request an AI review.
- Generated or edited text can be converted into Quick Write blocks and opened directly in Studio.
- The deterministic engine remains responsible for totals, timing checks, nested calculations, and structural warnings.
- AI is optional. Without a `GEMINI_API_KEY`, the app uses clearly labeled local demonstration responses.

### Local data and backup

Projects, folders, custom blocks, drafts, favorites, backpack items, calendar plans, preferences, and coach-library items are stored in the current browser's `localStorage`. Settings includes full local backup export/import and truthful boundaries about what is and is not uploaded.

## Run locally on Windows PowerShell

Requires Node.js 18 or newer.

Open PowerShell **inside the folder that contains `package.json`**, then run:

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Stop the local server with `Ctrl + C`.

The included `.npmrc` uses the public npm registry. The package lock is intentionally not bundled; `npm install` creates a fresh lock file for the current public dependency graph.

## Optional environment variables

Copy `.env.example` to `.env`.

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Enables live AI Coach responses. |
| `GEMINI_MODEL` | Overrides the server-side model. Default: `gemini-3.6-flash`. |
| `APP_URL` | Public deployment URL when hosted. |
| `PORT` | Local/server port. Default: `3000`. |

## Commands

```bash
npm run dev          # Express + Vite development server on port 3000
npm run build        # Build client and bundle production server
npm start            # Start the production build from dist/
npm run lint         # Strict TypeScript check
npm run test:math    # Deterministic calculator smoke tests
npm run test:studio  # Palette, nesting, Quick Write, movement, and PDF smoke tests
npm run clean        # Remove dist/
```

## Project structure

```text
.
├── server.ts
├── index.html
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── swimMath.ts
│   ├── swimStudioEngine.ts
│   ├── famousWorkouts.ts
│   ├── pdfExport.ts
│   ├── studioProjectTypes.ts
│   ├── studioSheetTypes.ts
│   └── components/
│       ├── SwimStudio.tsx
│       ├── ProjectsView.tsx
│       ├── FamousSetsView.tsx
│       ├── Calculators.tsx
│       ├── AICopilot.tsx
│       ├── CalendarView.tsx
│       ├── DashboardView.tsx
│       ├── CommunityView.tsx
│       └── SettingsView.tsx
├── scripts/
│   ├── math-smoke-test.ts
│   ├── studio-smoke-test.ts
│   └── pdf-visual-smoke-test.ts
└── docs/
    ├── RESEARCH_AND_FORMULAS.md
    ├── FINAL_VALIDATION_REPORT.md
    └── SetCraft_Deck_Sheet_Sample.pdf
```

## AI routes

The Express server exposes:

- `POST /api/gemini/generate-set`
- `POST /api/gemini/edit-set`
- `POST /api/gemini/audit-workout`
- `POST /api/gemini/chat`
- `GET /api/health`

Requests are size-limited and sanitized, responses fail safely to local drafts, and errors return JSON rather than crashing the interface.

## Important product boundary

SetCraft is a planning and communication tool. It is not a medical device, diagnosis system, autonomous training authority, or substitute for qualified coaching judgment. Coaches remain responsible for athlete suitability, supervision, progression, restrictions, and safe-sport obligations.

## Research notes

The product and calculator assumptions are documented in [`docs/RESEARCH_AND_FORMULAS.md`](docs/RESEARCH_AND_FORMULAS.md). Final verification details are in [`docs/FINAL_VALIDATION_REPORT.md`](docs/FINAL_VALIDATION_REPORT.md).

## License

Apache-2.0 (`SPDX-License-Identifier: Apache-2.0`).
