# LaneLab Final Research Build — implementation notes

## Release

- Product label: LaneLab Swim Studio — Final Research Build
- Application version: 1.1.0
- Interface badge: v8 Final
- Scope: swim-first coaching workflow; multi-sport remains a roadmap item

## Studio workflow

The Studio is separated into five large pages to reduce visual overload while preserving every feature:

1. Project Setup
2. Build Sets
3. Lane Plan
4. Deck Sheet
5. Review & Export

The sidebar exposes Project Hub and each Studio subsection. A user can also move through the in-Studio workflow controls.

## Block language

- 131 palette presets
- Linear set blocks plus C-shaped Section, Repeat, Progression, Condition, Time Cap, and Lane Branch containers
- Reorder and insert behavior preserves node identity
- Recursive totals for nested containers
- Reusable My Blocks, Favorites, and Backpack
- Quick Write parser for common coach notation
- Lock, collapse, duplicate, zoom, fit, search, undo, and redo

## Deterministic engine

The language model is not the source of mathematical truth. `swimStudioEngine.ts` and `swimMath.ts` provide:

- recursive distance and duration
- equipment, stroke, recovery, and high-intensity summaries
- booking overrun checks
- warm-up/cooldown checks
- pool-length mismatch notices
- send-off versus target-time feasibility
- target/fixed-rest data completeness
- empty control structure checks
- USRPT miss-rule checks
- unusually large RPE 9–10 blocks
- exact split normalization, pace, send-off, set, critical-speed, stroke, and conversion math

## Library

`famousWorkouts.ts` contains 30 complete workouts:

- transformed, attributed public-source-inspired templates
- original LaneLab templates for common training purposes
- every item opens as an editable Studio project
- coach-created projects can be added to the local Coach Library

## AI integration

- The server defaults to `gemini-3.6-flash` when a live key is supplied.
- Generate and edit results can be converted into editable block graphs.
- Review & Export includes an optional AI second opinion beside deterministic checks.
- Missing keys, malformed requests, and model failures degrade to labeled local fallbacks.
- Request bodies are capped and basic prompt inputs are normalized.

## Local-first storage

The build deliberately avoids pretending that a backend account system exists. Projects, folders, drafts, custom blocks, favorites, backpack items, calendar plans, and preferences use `localStorage`. Settings provides backup export/import and explains the limitation.

## Professional calculators

The calculator page includes:

- pace table
- split planner
- send-off/lane planner
- critical swim speed
- stroke efficiency
- set math
- course conversion

Each output is accompanied by assumptions and cautions. No official course-conversion claim is made.

## Validation completed in the final packaging environment

- 23 TypeScript/TSX source files syntax-transpiled with 0 diagnostics
- app internal TypeScript check passed using temporary external-module declarations
- server internal TypeScript check passed using temporary external-module declarations
- deterministic swim-math smoke tests passed
- 131 palette presets create unique usable nodes
- 30 library workouts produce finite positive totals
- nested Quick Write repeat calculation passed
- infeasible send-off warning passed

A complete `npm install`, browser build, and PDF smoke run still require access to the npm registry. The packaging environment had no outbound npm connectivity, so those commands were not falsely reported as executed here. They are included for local verification after installation.
