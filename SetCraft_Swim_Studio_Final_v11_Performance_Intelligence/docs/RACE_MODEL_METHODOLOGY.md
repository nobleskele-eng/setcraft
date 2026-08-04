# SetCraft Race Model v3

## Purpose and coverage

Race Intelligence answers separate questions: absolute American level, distance to the next target, exact-age strength, race-shape fit, split-level time loss and input reliability. Results are event-specific; the system does not assign one permanent level to an athlete.

| Dimension | Coverage |
|---|---|
| Events | 17 standard individual LCM events |
| Categories | Men and women, matching the source tables |
| Competitive levels | Sectionals, Nationals, Trials and World Class |
| Strategies | Three event-specific models per event/category/level |
| Current records | 34 LCM records, checked 4 August 2026 |
| Recent observed data | 99 medal performances across all 2025 Worlds individual finals |
| Age factor | USA Swimming exact-age standards, ages 10–18 where published |

## Absolute anchors

Sectionals use the 2026 USA Swimming maximum standard. Nationals use the 2026 18U table through age 18 and open table from 19. Trials use the latest published U.S. Trials standard (2024); non-Olympic 50 stroke events are visibly modeled equivalents. World Class is the mean of valid 2025 Worlds finalists.

## Checkpoints and provenance

| Distance | SetCraft checkpoints |
|---:|---|
| 50 m | 15, 25, 35, 50 m |
| 100 m | 25, 50, 75, 100 m |
| 200 m and longer | Every 50 m |

The current record total, athlete, date, meet and ratification state are stored for all 34 event/category combinations. Every checkpoint uses one visible class:

- **Official:** present in an official timing or governing-body result.
- **Secondary:** present in a named race-analysis source.
- **Estimated:** interpolated from known anchors using an event-normal model.
- **Coach:** supplied by a coach and not independently verified.

The World Aquatics catalogue is the source of truth for record totals. A complete checkpoint line never implies that every intermediate value was officially measured.

## Strategy construction

For checkpoint distances \(d_i\), event/strategy pace factors \(p_i\), and target time \(T\):

\[
w_i=d_ip_i,\qquad S_i=T\frac{w_i}{\sum_jw_j},\qquad C_i=\sum_{j\le i}S_j
\]

The final cumulative checkpoint is forced to exactly \(T\). Strategy families include sprint start/underwater, balanced speed, back-half speed, controlled aggression, even pressure, negative build, distance economy, surges and IM stroke-specific emphasis.

## Official World Aquatics points

For official 2026 base time \(B\) and swimmer time \(T\):

\[
P=\operatorname{trunc}\left(1000\left(\frac{B}{T}\right)^3\right)
\]

The 2026 base table is frozen for the calendar year. A new record set during 2026 may therefore score above 1000; SetCraft reports the percentage gap to the live record separately.

## Age, goal and SetCraft scores

The age score interpolates between exact-age USA Swimming B through AAAA standards. Goal readiness is \(100(G/T)^3\), capped at 100, where \(G\) is the selected target.

When an exact-age table is available, the SetCraft score is:

\[
0.60(\min(100,P/10))+0.25(A)+0.15(G_r)
\]

Without an age table it becomes 80% points performance and 20% goal readiness. Athlete-profile ratings never change these performance scores.

## Missing and invalid splits

The parser preserves empty positions. Thus `27.20,,1:26.20,1:56.00` means the 100 m checkpoint is unknown; later values do not shift left. Missing values are interpolated between the nearest valid anchors using the selected strategy profile, or a balanced event-normal model when no strategy exists. Invalid/non-monotonic entries are replaced and flagged. Every replacement remains labeled **Estimated**.

## Input quality

Input quality combines valid total time, monotonic/finish consistency, entered-versus-estimated checkpoint coverage, age/course/goal context, timing provenance and—only if turned on—athlete-profile completion. Estimates receive partial credit because an analysis can still be useful, but never the same certainty as entered splits.

## Athlete-profile factors

Height, body mass and ratings for strength, explosiveness, lactate production/tolerance, aerobic capacity, shoulder/ankle mobility and underwater skill are optional context. They are not laboratory measurements, diagnoses or automatic prescriptions. The app uses cautious conditional language and asks coaches to verify claims using measured 15 m, turn, video or testing data.

## Coach contributions

Coaches can add one race or import CSV:

```text
swimmer,event,sex,course,age,level,total,checkpoints,splits,meet,archetype,source_url
```

Checkpoint/split values use `|` inside CSV fields. Empty split positions are completed and marked estimated. Coach data remains manual/pending, is stored on the current device and can be exported or removed.

## Gemini and exports

The Gemini route receives deterministic scores and entered/estimated splits as locked facts. It explains rather than recalculates them. If Gemini is unavailable, the app uses a deterministic offline analysis. The standalone HTML export is readable without SetCraft; the JSON export retains masks, provenance, score components and optional profile context for future model work.

## Sources and boundaries

Exact URLs are stored in `src/raceModel.ts` and displayed inside Race Intelligence. Primary sources include USA Swimming standards, Omega official results, the World Aquatics current-record catalogue and official 2026 points tables. Peer-reviewed sources cover age trajectories, race phases and strength/turn associations.

- Modeled checkpoints do not replace video, instrumented timing or verified splits.
- Athlete ratings are coaching context, not medical or physiological diagnosis.
- Current official anchors are LCM; SCY/SCM require their own tables.
- Coaches must have authority to share contributed results, especially for minors.
- Public pages are not bulk-scraped without permission.
