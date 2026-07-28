# SetCraft Swim Studio

A spacious, Scratch‑inspired studio for programming swim practices. Coaches organize season projects, build executable sets from drag‑and‑drop blocks, plan lanes and rosters, and export a clean one‑page pool‑deck PDF — with deterministic distance/duration/intensity calculations and an optional Gemini‑powered AI coach.

> Version 1.0.0 · React 19 + Vite 6 + Express · TypeScript · Tailwind CSS v4

---

## Highlights

- **Scratch‑style block builder** — drag, connect, and nest training blocks (sections, repeats, progressions, conditions, lane branches, time caps) with snapping C‑shaped containers.
- **111 ready‑made presets** — warm‑ups, drills, kick/pull, aerobic, threshold, sprint, race‑pace, USRPT, test sets, recovery, plus reusable structure/control blocks.
- **Five‑stage workflow** — Project Setup → Build Sets → Lane Plan → Deck Sheet → Review & Export, all reachable from the sidebar and the in‑studio stepper.
- **Project Hub** — create projects and season folders, move/duplicate/delete, search, and reopen recent work. Folders can exist before any project does.
- **Lane planning** — rosters, swimmer notes, pace/send‑off defaults, and set‑specific lane overrides.
- **Deterministic analysis** — live distance, estimated duration, average load, high‑intensity/recovery splits, booking‑time usage, and validation warnings.
- **One‑page deck sheet** — portrait PDF with optional goal‑time tables and notes.
- **AI Coach (optional)** — generate, edit, and audit sets via Gemini; falls back to offline mock responses when no API key is set.
- **My Blocks, Favorites & Backpack** — save custom blocks, pin favorites, and carry blocks between projects.
- **Local‑first** — projects, folders, and drafts persist in `localStorage`; no account required.

## Tech stack

| Layer | What |
|---|---|
| UI | React 19, Tailwind CSS v4, lucide‑react icons, Space Grotesk / Inter / JetBrains Mono |
| Build/dev | Vite 6 (hosted by a small Express server in middleware mode), `tsx`, esbuild |
| Server | Express — serves the app and proxies AI requests to Gemini (`@google/genai`) |
| Export | `pdf-lib` for the deck‑sheet PDF |
| Language | TypeScript (strict typecheck via `tsc --noEmit`) |

## Getting started (Windows PowerShell)

Requires Node.js 18+.

```powershell
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

The included `.npmrc` and `package-lock.json` use the public npm registry.

### Environment variables

Copy `.env.example` to `.env` and fill in as needed. All are optional for local use.

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Enables live AI Coach responses. Without it, the app runs in offline/simulation mode. |
| `APP_URL` | Public URL of the deployment (self‑referential links / callbacks). |
| `PORT` | Server port (defaults to `3000`). |

## Scripts

```bash
npm run dev          # Start the Express + Vite dev server on :3000
npm run build        # Build the client (vite) and bundle the server (esbuild → dist/server.cjs)
npm start            # Run the production build from dist/
npm run lint         # TypeScript typecheck (tsc --noEmit)
npm run test:studio  # Studio smoke tests (presets, nesting, Quick Write, PDF)
npm run clean        # Remove the dist/ folder
```

## Project structure

```
.
├── server.ts                 # Express host: serves the app + /api/gemini/* endpoints
├── index.html                # Vite entry
├── vite.config.ts
├── src/
│   ├── main.tsx              # React root
│   ├── App.tsx               # App shell: sidebar nav + workspace header
│   ├── index.css             # Tailwind theme, tokens, and studio styling
│   ├── components/
│   │   ├── SwimStudio.tsx    # The studio: block builder, palette, inspector, workflow
│   │   ├── ProjectsView.tsx  # Project Hub
│   │   ├── DashboardView.tsx
│   │   ├── CalendarView.tsx  CommunityView.tsx  SettingsView.tsx
│   │   ├── FamousSetsView.tsx  Calculators.tsx  AICopilot.tsx
│   ├── swimStudioEngine.ts   # Deterministic totals & validation
│   ├── pdfExport.ts          # Deck‑sheet PDF generation
│   ├── famousWorkouts.ts     # Curated set library
│   └── *Types.ts, types.ts   # Shared types
├── scripts/                  # studio-smoke-test.ts, pdf-visual-smoke-test.ts
└── docs/                     # Sample deck‑sheet PDF
```

## AI endpoints

The server exposes four POST routes under `/api/gemini` used by the AI Coach:

- `/api/gemini/generate-set` — draft a set from a prompt
- `/api/gemini/edit-set` — revise an existing set
- `/api/gemini/audit-workout` — review a full workout
- `/api/gemini/chat` — free‑form coaching chat

Each degrades gracefully to a local fallback when `GEMINI_API_KEY` is absent or a request fails.

## Data & privacy

All projects, season folders, and auto‑saved drafts live in the browser's `localStorage`
(`setcraft_studio_projects`, `setcraft_project_folders`). Nothing is uploaded unless you
use the AI Coach, which sends the relevant prompt to Gemini through the local server.

## Keyboard shortcuts

Available in the Build Sets workspace: undo/redo (`Ctrl+Z` / `Ctrl+Y`), duplicate (`Ctrl+D`),
save (`Ctrl+S`), block search (`Ctrl+K`), delete selected (`Delete`), and shortcut help (`?`).

## License

Apache‑2.0 (`SPDX-License-Identifier: Apache-2.0`).
