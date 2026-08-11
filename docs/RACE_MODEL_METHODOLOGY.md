# SetCraft Race Model v4

## Purpose and coverage

SetCraft separates official facts, deterministic planning math and AI explanation. Every result is event-, category- and course-specific.

| Dimension | v13 coverage |
|---|---|
| Courses | LCM, SCM and SCY |
| LCM | 17 individual events; 34 men/women world records |
| SCM | 18 individual events including 100 IM; 36 men/women world records |
| SCY | Standard U.S. collegiate program; 28 men/women U.S. Open benchmarks |
| Review date | 11 August 2026 |
| Points | Official 2026 World Aquatics LCM and SCM bases |
| SCY comparisons | 2026 Sectionals, 2026 Winter Juniors and 2027 NCAA Division I |
| Age context | USA Swimming exact-age LCM standards, ages 10–18 where published; visibly normalized for other courses |

World Aquatics has no SCY world-record category. The UI, AI prompts and tests therefore use “U.S. Open benchmark” for yards.

## Checkpoints and provenance

| Race distance | Checkpoints |
|---:|---|
| 50 | 15, 25, 35, 50 |
| 100 | 25, 50, 75, 100 |
| 200 and longer | Every 50 |

Units follow the course. Checkpoints are labeled official, secondary, estimated or coach-supplied. A complete line never implies that every intermediate point was measured. Missing values preserve their position—`27.20,,1:26.20,1:56.00` keeps the second checkpoint unknown—and are interpolated between valid anchors.

## Strategy construction

For checkpoint segment distances \(d_i\), pace factors \(p_i\) and target time \(T\):

\[
w_i=d_ip_i,\qquad S_i=T\frac{w_i}{\sum_jw_j},\qquad C_i=\sum_{j\le i}S_j
\]

The final cumulative checkpoint is forced to exactly \(T\). Three event-specific shapes are ranked against optional athlete context. Each factor may be off, rated 1–10, or entered as a protocol-specific measured value. Context can change strategy fit only; it never alters a record, standard or official point score.

## Official field library

The generated non-record library contains 4,854 selected swims and 31,842 measured checkpoints from six official result sources. Selection is capped within course × event × category × performance-band cells so one large meet cannot dominate the interface. Every reference retains its total, original measured checkpoints, meet, round, source URL and checkpoint provenance.

Performance bands provide navigation rather than a new governing-body classification: 900+ AQUA points is World Class, 850–899 Trials, 750–849 Nationals and below 750 Sectionals for metric results. SCY bands use final/heat placement because official AQUA points are not defined for yards. World records are not part of this layer. Public under-18 names are replaced by anonymous athlete labels by default.

## Course points

For official base time \(B\) and swim time \(T\):

\[
P=\operatorname{trunc}\left(1000\left(\frac{B}{T}\right)^3\right)
\]

This is official World Aquatics points methodology for LCM and SCM. SCY uses the same cubic shape against the U.S. Open benchmark but is labeled **SetCraft course index**, not AQUA points.

## Course conversion

- LCM↔SCM: current same-sex record ratio for the matching event.
- SCM↔SCY: published NCAA factor, with 0.906 for standard events and the NCAA distance-event exceptions. Values are truncated beyond hundredths.
- LCM↔SCY: transparent two-step conversion through SCM.
- Physical metres/yards conversion remains available separately using 1 yd = 0.9144 m.

Every competitive conversion is a planning estimate. Meet-entry acceptance depends on the meet’s own proof-of-time and conversion rules.

## Scores and input quality

Goal readiness is \(100(G/T)^3\), capped at 100. The SetCraft performance score combines course points/index, exact or normalized age context, and goal readiness. Input quality separately evaluates total validity, monotonic splits, entered-versus-estimated coverage, age/goal context and timing provenance. Course choice and optional profile completeness do not inflate input quality.

## Athlete and lactate boundaries

The profile distinguishes a 1–10 “lactate tolerance” rating from a measured peak blood-lactate result. A measured result is stored as neutral, event- and sampling-time-dependent context; higher is never scored as automatically better. No athlete input is used to diagnose physiology, readiness, injury, body composition or talent. Coaches should validate strategy through measured timing, video and appropriately supervised testing.

## Gemini boundary

Gemini receives deterministic calculations and provenance labels as locked facts. It may explain and organize them but must not silently recalculate records, standards, points, conversions or splits. Without a key, the same routes return deterministic offline briefs. Model/RAG preparation is documented in `docs/AI_MODEL_IMPLEMENTATION_GUIDE.md`.

## Sources

Exact primary and supporting URLs are stored in `src/raceModel.ts` and rendered in Data & Method. They include World Aquatics record/points sources, USA Swimming standards, NCAA standards/conversion factors, official Omega results and peer-reviewed race-phase research.
