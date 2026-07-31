# SetCraft final validation report

Date: 2026-07-30  
Build: 1.1.0 / v8 Final

## Static and internal TypeScript validation

- 23 `.ts`/`.tsx` source and script files were syntax-transpiled.
- Syntax diagnostics: 0.
- Application internal type relationships passed with temporary declarations for unavailable installed packages.
- Server internal type relationships passed with temporary declarations for unavailable installed packages.

## Deterministic calculator validation

Passed checks include:

- time parsing
- minute carry after decimal rounding
- pace scaling
- split plans summing to the exact requested total
- send-off rounding and expected rest
- two-trial critical speed
- stroke rate and related metrics
- set distance and duration
- exact metre/yard conversion

The repeatable test file is `scripts/math-smoke-test.ts` and can be run after dependencies are installed:

```bash
npm run test:math
```

## Studio engine and library validation

- Palette presets: 131
- Library workouts: 30
- Every preset factory produced a node with a unique identifier.
- A nested Quick Write repeat calculated the expected distance.
- An impossible target-time/send-off combination triggered a deterministic zero/negative-rest warning.
- Every library workout produced a finite, positive calculated distance.

## Existing packaged smoke coverage

`scripts/studio-smoke-test.ts` checks:

- all palette preset factories
- insertion into each C-shaped container
- moving blocks without changing identity
- nested Quick Write totals
- one-page portrait PDF export

## Limitations of this packaging environment

The sandbox could not reach the npm registry, so it was not possible to run a fresh `npm install`, Vite production build, installed-package TypeScript check, or browser/PDF rendering cycle in this final pass. Source syntax, internal types, and dependency-free math/engine logic were still validated. On a normal connected computer, run:

```bash
npm install
npm run lint
npm run test:math
npm run test:studio
npm run build
```

Do not interpret this report as a claim that every possible browser interaction or every coaching scenario has been exhaustively proven. It records the checks actually performed.
