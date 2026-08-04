# SetCraft Race Model v2

## 1. What the model answers

The Race Lab keeps five questions separate:

1. Which American absolute standard has the swimmer reached?
2. How far is the swimmer from the next reference point?
3. How strong is the result for the swimmer's exact age?
4. Which pacing strategy best fits the event and swimmer type?
5. Where does the entered split line gain or lose time against that strategy?

A swimmer receives an event-specific result. The system never assigns one permanent level to the athlete across every stroke and distance.

## 2. Coverage

| Dimension | v2 coverage |
|---|---|
| Events | 50/100/200 Free, Back, Breast and Fly; 400/800/1500 Free; 200/400 IM |
| Categories | Men and women, matching the selected source tables |
| Course | LCM anchors; SCY/SCM are not silently converted into official LCM values |
| Levels | Sectionals, Nationals, Trials, World Class |
| Strategies | Three per event group and level |
| Age factor | USA Swimming single-age LCM standards, ages 10–18, where the event is published |
| Observed recent data | 2025 World Championships medal-race profiles in all 34 event/category finals |

At a selected age, the library creates:

\[
17\text{ events}\times 2\text{ categories}\times 4\text{ levels}\times 3\text{ strategies}=408\text{ modeled profiles}
\]

## 3. Absolute anchors

| Level | Anchor | Version |
|---|---|---|
| Sectionals | USA Swimming maximum Speedo Sectionals standard | 2026 |
| Nationals | Toyota Nationals; 18U table through age 18, open table from age 19 | 2026 |
| Trials | Most recent published U.S. Olympic Team Trials standard | 2024 |
| World Class | Mean of valid 2025 World Championships finalists | 2025 |

The official 2025 Omega Lenex file is parsed to calculate the final mean for every individual event. If a final has a tie or a disqualification, the mean uses the valid finalists present in the file.

The Olympic Trials do not hold 50 back, breast or fly. For those three events only, SetCraft creates a visible **Trials equivalent** halfway between Nationals and the 2025 Worlds final mean:

\[
T_{equiv}=T_{world}+0.52(T_{national}-T_{world})
\]

This value is always labeled modeled, never official.

## 4. Checkpoint policy

| Race distance | Required SetCraft checkpoints |
|---:|---|
| 50 | 15, 25, 35, 50 m |
| 100 | 25, 50, 75, 100 m |
| 200 and longer | Every 50 m through the finish |

Omega normally publishes 50 m cumulative splits. Therefore a named 50 m Worlds result contains only its official finish and reaction time, while its 15/25/35 m strategy targets remain derived. A named 100 m result normally contains official 50/100 m values; the 25/75 m strategy targets remain derived. SetCraft never merges those two data classes invisibly.

## 5. Observed and modeled records

An **observed** record reproduces the athlete, event, category, meet, date range, place, final time, reaction time and cumulative checkpoints present in an official result file.

A **modeled** record uses an official final-time anchor plus an event-specific pace-factor vector. For checkpoint distances \(d_i\), pace factors \(p_i\) and target time \(T\):

\[
w_i=d_ip_i,\qquad S_i=T\frac{w_i}{\sum_jw_j},\qquad C_i=\sum_{j\le i}S_j
\]

The last cumulative checkpoint is forced to exactly \(T\) after rounding. Tests reject non-increasing checkpoint lines or a finish that differs from the anchor.

## 6. Event strategy families

- 50s: start + underwater, balanced power, surface-speed finish.
- 100s: front-speed hold, balanced sprint, back-half speed.
- 200s: controlled aggression, even pressure, back-half build.
- 400s: early pressure, even pace, negative split.
- 800/1500: even economy, negative build, surge control.
- IM: fly-led pressure, breaststroke build, freestyle close.

Every strategy includes a description, the athlete type it best suits and the main execution risk. These are planning choices, not claims that one race shape is universally correct.

## 7. Age factor

The extractor reads the official USA Swimming 2024–2028 single-age LCM tables into a versioned event/category/age structure. Each published event stores cut times in fastest-to-slowest order:

```text
AAAA, AAA, AA, A, BB, B
```

Age-relative status and absolute competitive level remain independent. If USA Swimming does not publish an event for a younger age, the UI says **Not offered** instead of estimating a band.

## 8. Coach contributions

Coaches may add one race through the form or import the v2 CSV format:

```text
swimmer,event,sex,course,age,level,total,checkpoints,splits,meet,archetype,source_url
```

Checkpoint distances and cumulative times use `|` separators. The app validates:

- equal checkpoint and split counts;
- strictly increasing cumulative times;
- final cumulative split within 0.10 s of the final time;
- valid event, category, course and reference level.

Coach records remain `manual` / `pending verification`, even when a URL is attached. They are stored on the current device, can be exported and can be removed.

## 9. Sources and reproducibility

Primary sources:

- USA Swimming 2026 Speedo Sectionals standards.
- USA Swimming 2026 Toyota National Championships standards.
- USA Swimming 2024 Olympic Team Trials standards.
- USA Swimming 2024–2028 single-age motivational standards.
- Omega Timing 2025 World Aquatics Championships results book and Lenex file.
- Omega Timing 2024 U.S. Trials and 2025 Toyota Nationals men's 200 free finals.
- Official 2025 Central Zone North Speedo Sectionals HY-TEK result file.
- World Aquatics Paris 2024 results report for historical race-analysis context.

Exact URLs are stored in `src/raceModel.ts` and displayed inside Race Intelligence → Data & method. `scripts/extract-reference-data.mjs` regenerates the Worlds and age-standard source modules from the downloaded official files.

## 10. Boundaries

- This is coaching decision support, not an autonomous prescription or medical/readiness system.
- Modeled checkpoints do not replace measured race video, instrumented 15 m timing, turn analysis or verified official splits.
- Current absolute anchors are LCM. SCY and SCM need their own official tables and observed-data sources.
- Coach uploads require the club or coach to have authority to share the data, especially for minors.
- SwimCloud/SwimRankings pages should not be bulk-scraped without permission; SetCraft supports authorized imports and source links instead.
